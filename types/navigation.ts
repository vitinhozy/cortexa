import type { Href } from 'expo-router';

export type NavigationSection = '/ai' | '/overview' | '/study' | '/library' | '/profile';
export interface NavigationCrumb {
  label: string;
  href?: Href;
}
export interface NavigationLocation {
  sectionHref: NavigationSection;
  currentLabel: string;
  fallback: Href;
  crumbs: NavigationCrumb[];
}
