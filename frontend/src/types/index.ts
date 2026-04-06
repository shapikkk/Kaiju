export interface ApiResponse<T> {

  data: T;

}



export interface ApiListResponse<T> {

  data: T[];

}



export interface AuthResponse {

  user: User;

  token: string;

}



export interface LoginPayload {

  email: string;

  password: string;

}



export interface RegisterPayload {

  name: string;

  email: string;

  password: string;

  password_confirmation: string;

}



export type Priority = 'lowest' | 'low' | 'medium' | 'high' | 'highest';



export const PRIORITY_CONFIG: Record<

  Priority,

  { label: string; icon: string; color: string }

> = {

  lowest: { label: 'Lowest', icon: '⬇️', color: '#6b7280' },

  low: { label: 'Low', icon: '↓', color: '#3b82f6' },

  medium: { label: 'Medium', icon: '→', color: '#f59e0b' },

  high: { label: 'High', icon: '↑', color: '#f97316' },

  highest: { label: 'Highest', icon: '⬆️', color: '#ef4444' },

};



export type SprintStatus = 'planning' | 'active' | 'completed';



export type WorkspaceRole = 'owner' | 'admin' | 'member';



export interface Experience {

  company: string;

  title: string;

  start_date: string;

  end_date: string | null;

  current: boolean;

}



export interface User {

  id: number;

  name: string;

  email: string;

  avatar_url: string | null;

  banner_url: string | null;

  bio: string | null;

  job_title: string | null;

  department: string | null;

  location: string | null;

  skills: string[];

  experience: Experience[];

  notification_preferences: {
    email?: boolean;
    push?: boolean;
    assigned?: boolean;
    comments?: boolean;
    due_date?: boolean;
  } | null;

  email_verified_at: string | null;

  created_at: string;

}




export interface WorkspaceMember extends User {

  role: WorkspaceRole;

}



export interface UpdateProfilePayload {

  bio?: string | null;

  job_title?: string | null;

  department?: string | null;

  location?: string | null;

  skills?: string[];

  experience?: Experience[];

}



export interface Channel {
  id: number;
  name: string;
  description: string | null;
  is_default: boolean;
  position: number;
}

export interface CreateChannelPayload {
  name: string;
  description?: string;
}

export interface UpdateChannelPayload {
  name?: string;
  description?: string | null;
}

export interface WorkspaceMessage {
  channel_id: number;

  id: number;

  body: string;

  is_edited: boolean;

  reply_to_id: number | null;

  reply_to: {

    id: number;

    body: string;

    user: { id: number; name: string };

  } | null;

  attachment_url: string | null;

  attachment_name: string | null;

  attachment_type: 'image' | 'file' | null;

  created_at: string;

  user: {

    id: number;

    name: string;

    email: string;

    avatar_url: string | null;

  };

}



export interface DirectMessage {

  id: number;

  conversation_id: number;

  body: string;

  is_edited: boolean;

  reply_to_id: number | null;

  reply_to: {

    id: number;

    body: string;

    user: { id: number; name: string };

  } | null;

  attachment_url: string | null;

  attachment_name: string | null;

  attachment_type: 'image' | 'file' | null;

  created_at: string;

  user: {

    id: number;

    name: string;

    email: string;

    avatar_url: string | null;

  };

}



export interface Conversation {

  id: number;

  other_user: {

    id: number;

    name: string;

    email: string;

    avatar_url: string | null;

  } | null;

  other_user_last_read_at: string | null;

  last_message: DirectMessage | null;

  unread_count: number;

  local_name: string | null;

  local_note: string | null;

}





export interface Workspace {

  id: number;

  name: string;

  slug: string;

  description: string | null;

  owner?: User;

  members?: User[];

  boards?: Board[];

  created_at: string;

  updated_at: string;

}



export interface Board {

  id: number;

  workspace_id: number;

  name: string;

  slug: string;

  description: string | null;

  color: string | null;

  position: number;

  task_counter: number;

  columns?: Column[];

  sprints?: Sprint[];

  created_at: string;

  updated_at: string;

}



export interface Column {

  id: number;

  board_id: number;

  name: string;

  slug: string;

  color: string | null;

  position: number;

  is_done_column: boolean;

  wip_limit: number | null;

  tasks?: Task[];

  tasks_count?: number;

}



export interface Sprint {

  id: number;

  board_id: number;

  name: string;

  goal: string | null;

  status: SprintStatus;

  started_at: string | null;

  ended_at: string | null;

  created_at: string;

}



export interface Epic {

  id: number;

  workspace_id: number;

  name: string;

  summary: string | null;

  color: string | null;

  tasks_count?: number;

  created_at: string;

}



export interface Tag {

  id: number;

  name: string;

  color: string;

}



export interface Task {

  id: number;

  board_id: number;

  column_id: number;

  sprint_id: number | null;

  epic_id: number | null;

  key: string;

  title: string;

  description: string | null;

  priority: Priority;

  priority_label: string;

  priority_icon: string;

  task_number: number;

  position: number;

  due_date: string | null;

  estimated_hours: number | null;

  creator?: User;

  assignee?: User | null;

  column?: Column;

  sprint?: Sprint | null;

  epic?: Epic | null;

  tags?: Tag[];

  comments?: Comment[];

  attachments?: Attachment[];

  comments_count?: number;

  attachments_count?: number;

  created_at: string;

  updated_at: string;

}



export interface Comment {

  id: number;

  task_id: number;

  body: string;

  user?: User;

  created_at: string;

  updated_at: string;

}



export interface Attachment {

  id: number;

  task_id: number;

  filename: string;

  mime_type: string;

  size_bytes: number;

  url: string;

  user?: User;

  created_at: string;

}



export interface CreateWorkspacePayload {

  name: string;

  slug: string;

  description?: string;

}



export interface CreateBoardPayload {

  name: string;

  slug: string;

  prefix?: string;

  description?: string;

  color?: string;

}



export interface CreateColumnPayload {

  name: string;

  slug: string;

  color?: string;

  wip_limit?: number;

  is_done_column?: boolean;

}



export interface CreateTaskPayload {

  column_id: number;

  title: string;

  description?: string;

  priority?: Priority;

  assignee_id?: number;

  sprint_id?: number;

  epic_id?: number;

  due_date?: string;

  estimated_hours?: number;

  tag_ids?: number[];

}



export interface UpdateTaskPayload {

  title?: string;

  description?: string;

  priority?: Priority;

  assignee_id?: number | null;

  sprint_id?: number | null;

  epic_id?: number | null;

  due_date?: string | null;

  estimated_hours?: number | null;

  tag_ids?: number[];

}



export interface MoveTaskPayload {

  column_id: number;

  position: number;

}



export interface CreateCommentPayload {

  body: string;

}



export interface CreateSprintPayload {

  name: string;

  goal?: string;

}



export interface UpdateSprintPayload {

  name?: string;

  goal?: string;

  status?: SprintStatus;

}



export interface CreateEpicPayload {

  name: string;

  summary?: string;

  color?: string;

}



export interface CreateTagPayload {

  name: string;

  color?: string;

}



export interface UpdatePasswordPayload {

  current_password: string;

  password: string;

  password_confirmation: string;

}



export interface SearchTaskResult {

  id: number;

  key: string;

  title: string;

  priority: Priority;

  board_slug: string;

  workspace_slug: string;

}



export interface SearchBoardResult {

  id: number;

  name: string;

  slug: string;

  color: string | null;

}



export interface SearchUserResult {

  id: number;

  name: string;

  email: string;

  avatar_url: string | null;

}



export interface SearchResults {

  tasks: SearchTaskResult[];

  boards: SearchBoardResult[];

  users: SearchUserResult[];

}

