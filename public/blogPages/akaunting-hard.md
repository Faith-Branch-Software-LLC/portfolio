---
title: Akaunting Installation Guide (while port 80 is in use)
description: Use port 8080 to install Akaunting rather than 80
date: 2025-05-08
imageUrl: /images/akaunting-hard.png
tags:
  - ubuntu
  - install
  - akaunting
  - hard
published: "true"
---
# Akaunting Installation Guide (while port 80 is in use)

This guide walks you through installing the [Akaunting](https://akaunting.com/) web app on a virtual machine running Ubuntu server with Apache, PHP, and MySQL. This is considering that it may be a fresh install of the OS.

My situation is likely different from many others. I decided to use Kamal to deploy a Next.js app to the main URL (faithbranch.com) on Digital Ocean Droplet. This means that ports 80 and 443 are taken and we have no access to them. This second set of steps is going to put the app at accounting.url.com:8080 (or in my case accounting.faithbranch.com:8080).

---
## DNS Setup

Update your DNS records to add an `A` record:

- **Type**: A
- **Name**: `accounting`
- **Value**: your server’s IP address
- **TTL**: default (e.g. 3600)

Wait for it to propagate.

---
## 📋 Requirements

### ✅ System Update

Update and upgrade your package list:
```bash
sudo apt update
sudo apt upgrade
```

### 🌐 Apache Setup

Apache may already be installed, but it's good to verify:
```bash
sudo apt install apache2
sudo a2enmod rewrite
```

Change the Apache listening port.
```bash
sudo vim /etc/apache2/ports.conf
```

Change or add the listening port.
```apacheconf
Listen 8080
```

Create a new Apache configuration file:

```bash
sudo vim /etc/apache2/sites-available/accounting.url.com.conf
```

Example config:
```apacheconf
<VirtualHost *:8080>
    ServerName accounting.url.com
    DocumentRoot /var/www/akaunting
    
    <Directory /var/www/akaunting>
        AllowOverride All
        Require all granted
    </Directory>
	
    ErrorLog ${APACHE_LOG_DIR}/accounting_error.log
    CustomLog ${APACHE_LOG_DIR}/accounting_access.log combined
</VirtualHost>
```

Then enable the site and reload Apache:
```bash
sudo mkdir -p /var/www/akaunting
sudo a2ensite accounting.url.com.conf
sudo systemctl reload apache2
```

---
### 📜 CertBot Install

> [!caution]
> This will just assign certificates, but will not get you off of using the 8080 port. You can skip this step for now if you are in a situation like mine and have kamal for your main app.
> 
> If anyone knows a way to reverse proxy an application from a kamal app please contact me.


Install Certbot if it’s not already installed:
```bash
sudo apt install certbot python3-certbot-apache
```

#### 🔧 Manual DNS Challenge

Run:
```bash
sudo certbot certonly --manual --preferred-challenges dns -d accounting.url.com
```

You’ll get a prompt like this:
```bash
Please deploy a DNS TXT record under the name
_acme-challenge.accounting.url.com with the following value:
	
    abcdefghijklmnop1234567890
	
Before continuing, verify the record is deployed.
```

##### 🌐 3. Create the TXT Record in Your DNS Provider

- **Go to your DNS management panel** (where your domain is hosted: GoDaddy, Cloudflare, Namecheap, etc.)
- **Create a TXT record**:
    - **Name**: `_acme-challenge.accounting` _(do not include `.url.com` if your DNS provider appends it)_
    - **Type**: `TXT`
    - **Value**: The string Certbot gave you (e.g., `abcdefghijklmnop1234567890`)

⚠️ Wait ~1–5 minutes for DNS to propagate.

##### ✅ 4. Verify and Continue

- Once added, **press Enter** in the terminal to continue Certbot.
- Certbot will verify the record and issue the certificate.

You should see something like:

```bash
Congratulations! Your certificate and chain have been saved at:
/etc/letsencrypt/live/accounting.url.com/fullchain.pem
```

##### 📁 Step 5: Configure Apache to Use the Certificate

Create an SSL VirtualHost (e.g. in `/etc/apache2/sites-available/accounting-ssl.conf`):
```bash
<VirtualHost *:443>
    ServerName accounting.url.com
    DocumentRoot /var/www/akaunting
	
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/accounting.url.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/accounting.url.com/privkey.pem
	
    <Directory /var/www/akaunting>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Enable required modules and the site:
```bash
sudo a2enmod ssl
sudo a2ensite accounting-ssl.conf
sudo systemctl reload apache2
```

##### 🔁 Certificate Renewal (Manual)

DNS challenges can’t be auto-renewed unless you script it or use a DNS plugin with API access. Otherwise, repeat this process every ~90 days.

#### ✅ Step-by-Step: DNS-01 Challenge Automation with DigitalOcean

##### 🔐 1. Create a DigitalOcean API Token

Go to: https://cloud.digitalocean.com/account/api/tokens
- Click **Generate New Token**
- Name it something like `certbot`
- **Select read & write** scopes (needed for DNS)
- Save the token somewhere safe (you’ll need it in step 3)

##### 🧩 2. Install Certbot and the DigitalOcean Plugin

```bash
sudo apt install certbot python3-certbot-dns-digitalocean
```

##### 📝 3. Create a Config File for the API Token

Create a secure credentials file:
```bash
sudo mkdir -p /etc/letsencrypt/digitalocean
sudo nano /etc/letsencrypt/digitalocean/credentials.ini
```

Paste in:
```ini
dns_digitalocean_token = YOUR_DIGITALOCEAN_API_TOKEN_HERE
```

Then:
```bash
sudo chmod 600 /etc/letsencrypt/digitalocean/credentials.ini
```

##### 🏃‍♂️ 4. Run Certbot Using the DNS Plugin

```bash
sudo certbot certonly \
  --dns-digitalocean \
  --dns-digitalocean-credentials /etc/letsencrypt/digitalocean/credentials.ini \
  -d accounting.url.com

sudo systemctl reload apache2
```

It will automatically create the TXT record, wait, verify, and issue your cert. 

This setup will automatically renew the certificate when `certbot renew` is run (usually by a cron job or systemd timer).

---
### ⚙️ PHP Installation

Install PHP and required extensions:
```bash
sudo apt install php-common libapache2-mod-php php-cli
systemctl restart apache2

sudo apt install php-bcmath php-curl php-dom php-intl php-gd php-mbstring php-xml php-zip php-mysql
systemctl restart apache2
```

Verify the required modules:
```bash
php -m
```

Ensure the following are listed:
- BCMath
- Ctype 
- cURL 
- DOM 
- FileInfo 
- Intl 
- GD
- JSON 
- Mbstring
- mysql
- OpenSSL
- PDO
- Tokenizer
- XML
- Zip

### 🛢️ MySQL Installation

Install and secure MySQL:
```bash
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation
```

Create the database and user:
```bash
sudo mysql -u root -p
```

In the MySQL shell:
```sql
CREATE DATABASE akaunting;
CREATE USER 'aka'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON akaunting.* TO 'aka'@'localhost';
FLUSH PRIVILEGES;
\q
```

---
## 📦 Akaunting Installation

1. Download Akaunting
```bash
sudo apt-get install unzip

curl -L "https://akaunting.com/download.php?version=latest" -o akaunting-latest.zip
unzip akaunting-latest.zip -d akaunting

cd akaunting
mv .env.example .env
cd ~
```

2. Replace Apache's default web root
```bash
shopt -s dotglob
sudo mv akaunting/* /var/www/akaunting
```

3. Setup Laravel key
```bash
cd /var/www/akaunting
php artisan key:generate
```

4. Verify all files are present
```bash
vim . # Check for .env and .htaccess
cd ~

systemctl restart apache2
```

---

## ✅ Final Steps

1. Set permissions:
```bash
sudo chown -R www-data:www-data /var/www/akaunting
```

2. Visit the Akaunting site in your browser by going to http://accounting.url.com:8080 and start the the installation steps.