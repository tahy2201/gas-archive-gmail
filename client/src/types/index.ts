/**
 * 型定義
 */

export interface Rule {
  id: string;
  type: 'filter' | 'archive' | 'both';
  enabled: boolean;
  name: string;
  description?: string;
  criteria: {
    from?: string;
    to?: string;
    subject?: string;
    query?: string;
    negatedQuery?: string;
    hasAttachment?: boolean;
    excludeChats?: boolean;
    size?: number;
    sizeComparison?: 'larger' | 'smaller';
  };
  actions: {
    addLabelIds?: string[];
    removeLabelIds?: string[];
    forward?: string;
    archive?: boolean;
    trash?: boolean;
  };
  schedule?: 'manual' | 'hourly' | 'daily' | 'weekly';
  createdAt: string;
  updatedAt: string;
}

export interface RulesConfig {
  version: string;
  lastUpdated: string;
  rules: Rule[];
}

export interface GmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
  messageListVisibility?: string;
  labelListVisibility?: string;
  color?: {
    textColor?: string;
    backgroundColor?: string;
  };
}

export interface User {
  email: string;
}

export interface GitCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    date: string;
  };
}
