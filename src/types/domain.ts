/**
 * Core domain types for ghstats
 */

export type Bucket = "day" | "week";

export interface TimeRange {
  from: Date;
  to: Date;
  bucket: Bucket;
}

export type TimelineMetric = "commits" | "prs" | "loc" | "activeDays";

export interface GitHubUser {
  login: string;
  id: number;
  name?: string;
  company?: string;
  location?: string;
  publicRepos: number;
}

export interface Repository {
  owner: string;
  name: string;
  url: string;
  description?: string;
  stars: number;
  language?: string;
}

export interface ActivityStats {
  commits: number;
  pullRequests: number;
  issues: number;
  codeReviewComments: number;
  linesOfCode: number;
  activeDays: number;
}
