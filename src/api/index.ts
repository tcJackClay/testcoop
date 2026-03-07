/**
 * API Services Index
 * All API modules for the Animation Workbench backend
 */

export { apiClient, type ApiResponse, type PageResult } from './client'

// Auth
export { authApi, type LoginRequest, type LoginResponse, type RegisterRequest } from './auth'

// User
export { userApi, type UserDTO, type CreateUserRequest, type UpdateUserRequest } from './user'

// Project
export { projectApi, type Project, type CreateProjectRequest, type UpdateProjectRequest } from './project'

// Vector Engine
export { 
  vectorApi, 
  type ImageUploadRequest, 
  type ImageUploadResponse,
  type ImageGenRequest, 
  type ImageResponse,
  type VideoRequest, 
  type SoraVideoResponse,
  type VectorChatCompletionRequest 
} from './vector'

// RunningHub
export { 
  runningHubApi, 
  type RHApp, 
  type RHTaskRequest, 
  type RHTaskResponse, 
  type RHTaskResult 
} from './runningHub'

// Image
export { imageApi, type Image, type CreateImageRequest, type UpdateImageRequest } from './image'

// Video
export { videoApi, type Video, type CreateVideoRequest, type UpdateVideoRequest } from './video'

// Script
export { scriptApi, type Script, type CreateScriptRequest, type UpdateScriptRequest } from './script'

// Storyboard Script
export { 
  storyboardScriptApi, 
  type StoryboardScript, 
  type CreateStoryboardScriptRequest, 
  type UpdateStoryboardScriptRequest 
} from './storyboardScript'

// System Prompt
export { 
  systemPromptApi, 
  type SystemPrompt, 
  type CreateSystemPromptRequest, 
  type UpdateSystemPromptRequest 
} from './systemPrompt'

// Prompt
export { promptApi, type Prompt, type CreatePromptRequest, type UpdatePromptRequest } from './prompt'

// Story Outline
export { 
  storyOutlineApi, 
  type StoryOutline, 
  type CreateStoryOutlineRequest, 
  type UpdateStoryOutlineRequest 
} from './storyOutline'

// Grid Storyboard
export { 
  gridStoryboardApi, 
  type GridStoryboard, 
  type CreateGridStoryboardRequest, 
  type UpdateGridStoryboardRequest 
} from './gridStoryboard'

// Episode Script
export { 
  episodeScriptApi, 
  type EpisodeScript, 
  type CreateEpisodeScriptRequest, 
  type UpdateEpisodeScriptRequest 
} from './episodeScript'

// Approval
export { approvalApi, type Approval, type CreateApprovalRequest, type ApprovalRequest } from './approval'

// Config
export { configApi, type ApiConfig, type CreateApiConfigRequest, type UpdateApiConfigRequest } from './config'

// Model
export { modelApi, type ModelConfig, type CreateModelRequest, type UpdateModelRequest } from './model'

// Task
export { taskApi, type TaskRequest, type TaskResult, type TaskStatus, type TaskType } from './task'
