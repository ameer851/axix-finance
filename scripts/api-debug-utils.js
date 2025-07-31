// api-debug-utils.js - Utilities for API debugging
import { CookieJar } from 'tough-cookie';

// Custom CookieJar class with built-in promisify for easier async usage
export class CookieJarWithTools extends CookieJar {
  getCookies(url, callback) {
    super.getCookies(url, callback);
  }
  
  setCookie(cookieString, url, callback) {
    super.setCookie(cookieString, url, callback);
  }
}
