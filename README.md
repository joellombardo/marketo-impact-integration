# Marketo impact.com/advocate Integration for WordPress

Marketo impact.com/advocate Integration is a WordPress plugin that integrates Marketo forms with impact.com/advocate for referral tracking. It captures form fields and securely sends user data using JWT authentication.

## Features
- Capture and send data from Marketo forms to Impact.com.
- Generate JWTs for secure API communication.
- Inject referral code from SaaSquatch tracking cookies into optional Marketo field.
- Inject Universal Tracking Tags into your site.
- Debug mode for verbose logging during development.

## Requirements
- Tested on PHP 8.3 or higher
- Tested on WordPress 6.7 or higher
- Node.js (for development)
- Composer (for dependency management)

## Installation
1. Download the latest release zip file from the [`/dist` directory](https://github.com/joellombardo/marketo-impact-integration/tree/main/dist) or build it yourself using the instructions in the **Development** section.
2. Extract the zip file and place the files in the `wp-content/plugins/marketo-impact-integration` directory.
3. Activate the plugin from the WordPress **Plugins** menu.
4. Configure the plugin under **Tools > Marketo impact/advocate Integration**.

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
Build Release: Generate a production-ready zip file in the `/dist` directory:
```
npx gulp build
```
Enable debug mode in plugin settings for detailed logging during development.

## License
This plugin is licensed under the [GPLv2 (or later)](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html).