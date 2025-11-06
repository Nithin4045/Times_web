import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';
 
export const routing = defineRouting({

  // A list of all locales that are supported
  locales: ['en', 'te','hin','tam'],
  // Used when no locale matches
  defaultLocale: 'en',
  localePrefix : 'never',
  localeDetection : true

});
 
export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);