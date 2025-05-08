---
title: General Akaunting Installation Guide
description: Install Akaunting on a server by itself
date: 2025-05-07
imageUrl: /images/akaunting-easy.png
tags:
  - ubuntu
  - install
  - akaunting
published: "true"
---
# Akaunting Installation Guide

This guide walks you through installing the [Akaunting](https://akaunting.com/) web app on a virtual machine running Ubuntu server with Apache, PHP, and MySQL. This is considering that it may be a fresh install of the OS.

---
## 📋 Requirements

### ✅ System Update

Update and upgrade your package list:
```bash
sudo apt update
sudo apt upgrade
```

### 🌐 Apache Installation

Apache may already be installed, but it's good to verify:
```bash
sudo apt install apache2
sudo a2enmod rewrite
systemctl restart apache2
```

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
sudo rm /var/www/html/index.html
shopt -s dotglob
sudo mv akaunting/* /var/www/html
```

3. Setup Laravel key
```bash
cd /var/www/html
php artisan key:generate
```

4. Verify all files are present
```bash
vim . # Check for .env and .htaccess
cd ~
```

---
## 🔧 Apache Configuration

Ensure Apache is configured to allow overrides:
```bash
sudo vim /etc/apache2/apache2.conf
```

Look for and update (or add) the following:
```apacheconf
<Directory /var/www/html>
    AllowOverride All
</Directory>
```

Then restart Apache:
```bash
systemctl restart apache2
```

---

## ✅ Final Steps

1. Set permissions:
```bash
sudo chown -R www-data:www-data /var/www/html
```

2. Visit the Akaunting site in your browser using your VM’s IP address (find this by using the `ifconfig` bash command).
