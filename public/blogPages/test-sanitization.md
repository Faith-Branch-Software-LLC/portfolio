---
title: Testing HTML Sanitization
description: This post tests DOMPurify sanitization
date: 2023-04-20
imageUrl: /images/flower-sep.svg
tags: [test, security]
published: true
---

# Testing HTML Sanitization

This post tests how DOMPurify sanitizes potentially dangerous HTML.

## Safe HTML Elements

Here are some safe HTML elements that should be preserved:

- **Bold text** and *italic text*
- [A link to Google](https://google.com)
- Lists like this one
- `Inline code`

## Code Blocks

```javascript
function testFunction() {
  console.log("This is a code block");
  const dangerousCode = "<script>alert('XSS')</script>";
  return "This should be displayed properly";
}
```

## Potentially Dangerous HTML

The following elements should be sanitized and removed:

<script>alert("This script should be removed")</script>

<iframe src="https://malicious-site.com"></iframe>

<img src="x" onerror="alert('This should be sanitized')">

<a href="javascript:alert('This should be sanitized')">Dangerous Link</a>

## Images

The following image should be displayed:

![Flower Separator](/images/flower-sep.svg)

## Conclusion

If DOMPurify is working correctly, all dangerous HTML elements and attributes should be removed while preserving the safe content. 