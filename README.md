# Marketo Impact Integration

Marketo Impact Integration is a WordPress plugin that integrates Marketo forms with Impact.com for referral tracking. It captures form fields and securely sends user data using JWT authentication.

## Features
- Capture and send data from Marketo forms to Impact.com.
- Generate JWTs for secure API communication.
- Inject Universal Tracking Tags into your site.
- Debug mode for verbose logging during development.

## Requirements
- PHP 7.4 or higher
- WordPress 5.5 or higher
- Node.js (for development)
- Composer (for dependency management)

## Installation
1. Download or clone the plugin files.
2. Place the files in the `wp-content/plugins/marketo-impact-integration` directory.
3. Activate the plugin from the WordPress **Plugins** menu.
4. Configure the plugin under **Settings > Marketo Impact Integration**.

## Development
Install dependencies:

```bash
npm install
composer install
```
Minify JavaScript:
```
npx gulp
```
Enable debug mode in plugin settings for detailed logging during development.

## License
This plugin is licensed under the [GPLv2 (or later)](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html).

