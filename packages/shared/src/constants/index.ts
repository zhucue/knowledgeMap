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

// 知识库可见性
export enum KbVisibility {
  PRIVATE = 'private',
  SHARED = 'shared',
  PUBLIC = 'public',
}

// 知识库协作者角色
export enum KbCollaboratorRole {
  VIEWER = 'viewer',
  EDITOR = 'editor',
}

// 知识库文档处理状态
export enum KbDocumentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// 知识库支持的文件类型
export enum KbFileType {
  PDF = 'pdf',
  DOCX = 'docx',
  MD = 'md',
  TXT = 'txt',
}
