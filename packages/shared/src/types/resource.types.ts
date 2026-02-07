export interface Resource {
  id: number;
  title: string;
  url: string;
  resourceType: string;
  domain: string;
  tags: string[];
  description: string | null;
  source: string;
  qualityScore: number;
  createdAt: string;
}

export interface BrowseRecord {
  id: number;
  resourceId: number;
  resourceTitle: string;
  resourceUrl: string;
  resourceType: string;
  graphNodeLabel?: string;
  createdAt: string;
}
