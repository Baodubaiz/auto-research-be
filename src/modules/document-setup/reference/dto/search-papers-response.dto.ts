export class PaperItemDto {
  title!: string;
  user_language_title?: string;
  year?: number;
  authors?: string;
  journal?: string;
  q?: string;
  url?: string;
  open_access?: boolean;
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
