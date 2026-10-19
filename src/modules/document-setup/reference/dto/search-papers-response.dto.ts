export class PaperItemDto {
  title!: string;
  user_language_title?: string;
  userLanguageTitle?: string;
  year?: number | string;
  authors?: string | string[];
  journal?: string;
  q?: string;
  url?: string;
  open_access?: boolean;
  openAccess?: boolean;
  status?: string;
  citation?: number | string;
  abstract?: string;
  venue?: string;
}

export class SearchPapersResponseDto {
  jobId!: string;
  sessionId!: string;
  papers!: PaperItemDto[];
  total!: number;
}
