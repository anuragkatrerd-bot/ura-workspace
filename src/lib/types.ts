export type Folder = {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
};

export type FileRecord = {
  id: string;
  filename: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  folder_id: string | null;
  uploaded_at: string;
};

export type Reminder = {
  id: string;
  title: string;
  description: string | null;
  remind_at: string | null;
  completed: boolean;
  created_at: string;
};

export type Task = {
  id: string;
  instruction: string;
  output: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
};

export type DocumentRecord = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};
