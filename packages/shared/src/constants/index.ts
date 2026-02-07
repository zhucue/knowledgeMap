export enum NodeType {
  ROOT = 'root',
  BRANCH = 'branch',
  LEAF = 'leaf',
}

export enum ResourceType {
  ARTICLE = 'article',
  VIDEO = 'video',
  DOCUMENT = 'document',
  TUTORIAL = 'tutorial',
  BOOK = 'book',
}

export enum ResourceSource {
  SYSTEM = 'system',
  USER_UPLOAD = 'user_upload',
}

export enum GraphStatus {
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ChatSessionStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export enum ChatMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum RelationshipType {
  PREREQUISITE = 'prerequisite',
  CONTAINS = 'contains',
  RELATED_TO = 'related_to',
  LEADS_TO = 'leads_to',
  PART_OF = 'part_of',
  DEPENDS_ON = 'depends_on',
}
