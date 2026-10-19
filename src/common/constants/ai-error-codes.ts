export interface AiErrorDetail {
  name: string;
  message: string;
}

export const AI_ERROR_DEFINITIONS: Record<number, AiErrorDetail> = {
  // 1. Common / LLM System Codes (401 - 609)
  401: { name: 'LLM_AUTHENTICATION_ERROR', message: 'Lỗi xác thực khóa API của mô hình ngôn ngữ lớn (LLM).' },
  403: { name: 'LLM_PERMISSION_DENIED', message: 'Không có quyền truy cập vào mô hình hoặc tài nguyên chỉ định.' },
  429: { name: 'LLM_QUOTA_LIMIT', message: 'Hạn ngạch gọi mô hình AI đã vượt giới hạn, vui lòng thử lại sau.' },
  500: { name: 'LLM_PROVIDERS_UNKNOWN_ERROR', message: 'Lỗi không xác định từ nhà cung cấp mô hình AI.' },
  503: { name: 'LLM_PROVIDERS_UNAVAILABLE', message: 'Dịch vụ mô hình AI hiện đang tạm thời không khả dụng.' },
  600: { name: 'NETWORK_ERROR', message: 'Lỗi kết nối mạng giữa Gateway và hệ thống AI Engine.' },
  601: { name: 'READ_PAPER_ERROR', message: 'Không thể đọc hoặc bóc tách nội dung bài báo khoa học.' },
  602: { name: 'READ_PAPER_ERROR_FILE_TYPE', message: 'Định dạng tệp không được hỗ trợ để đọc nội dung.' },
  603: { name: 'INVALID_PARAMS', message: 'Tham số yêu cầu không hợp lệ hoặc thiếu trường dữ liệu bắt buộc.' },
  604: { name: 'TIME_OUT_REQUEST', message: 'Yêu cầu xử lý tới AI Engine đã bị quá thời gian chờ (timeout).' },
  605: { name: 'NOT_IMPLEMENT_MODEL', message: 'Mô hình AI được yêu cầu chưa được hệ thống hỗ trợ.' },
  606: { name: 'EVENT_NOT_FOUND', message: 'Tên sự kiện yêu cầu không tồn tại trong hệ thống AI Engine.' },
  607: { name: 'MAXIMUM_RETRY', message: 'Đã thử lại tối đa số lần nhưng tác vụ vẫn không thành công.' },
  608: { name: 'UNKNOWN', message: 'Lỗi không xác định từ hệ thống AI Engine.' },
  609: { name: 'MAX_OUTPUT_TOKENS', message: 'Nội dung sinh vượt quá độ dài tối đa cho phép của mô hình.' },

  // 2. Document Setup Module (610 - 628)
  610: { name: 'SEARCH_PAPERS_ERROR', message: 'Lỗi khi tìm kiếm bài báo khoa học trực tuyến.' },
  611: { name: 'GENERATE_DOMAINS_ERROR', message: 'Lỗi khi gợi ý danh sách lĩnh vực nghiên cứu.' },
  612: { name: 'GENERATE_SUBDOMAINS_ERROR', message: 'Lỗi khi gợi ý các hướng nghiên cứu hẹp.' },
  613: { name: 'GENERATE_KEYWORDS_ERROR', message: 'Lỗi khi sinh danh sách từ khóa nghiên cứu.' },
  614: { name: 'GENERATE_TITLES_ERROR', message: 'Lỗi khi gợi ý danh sách tên đề tài nghiên cứu.' },
  615: { name: 'GENERATE_TITLE_DESCRIPTION_ERROR', message: 'Lỗi khi chi tiết hóa bản mô tả đề xuất nghiên cứu.' },
  616: { name: 'MIX_TITLES_ERROR', message: 'Lỗi khi phối hợp nội dung giữa nhiều đề tài.' },
  617: { name: 'GENERATE_OUTLINE_ERROR', message: 'Lỗi khi sinh đề cương chi tiết cho bài báo cáo.' },
  618: { name: 'ADMIN_DOCUMENTS_ERROR', message: 'Lỗi khi xử lý tài liệu mẫu dành cho quản trị viên.' },
  619: { name: 'USER_GUIDE_DOCUMENTS_ERROR', message: 'Lỗi khi xử lý tài liệu hướng dẫn người dùng.' },
  620: { name: 'USER_DOCUMENTS_ERROR', message: 'Lỗi khi bóc tách và phân tích tài liệu PDF tải lên.' },
  621: { name: 'EMBED_USER_DOCUMENTS_ERROR', message: 'Lỗi khi vector hóa nội dung tài liệu vào cơ sở dữ liệu vector.' },
  622: { name: 'DELETE_DOCUMENTS_ERROR', message: 'Lỗi khi xóa tài liệu người dùng khỏi kho lưu trữ vector.' },
  623: { name: 'GET_RESEARCH_TYPE_ERROR', message: 'Lỗi khi xác định phương pháp luận và loại hình nghiên cứu.' },
  624: { name: 'GENERATE_TITLE_DESCRIPTION_NO_INFO_ERROR', message: 'Lỗi khi chi tiết hóa đề tài từ dữ liệu người dùng tự nhập.' },
  625: { name: 'SEARCH_USER_DOCUMENTS_ERROR', message: 'Lỗi khi tìm kiếm ngữ nghĩa trong tài liệu người dùng tải lên.' },
  626: { name: 'GENERATE_OUTLINE_WITH_REFS_ERROR', message: 'Lỗi khi ánh xạ tài liệu tham khảo vào các mục đề cương.' },
  627: { name: 'MODIFY_OUTLINE_ERROR', message: 'Lỗi khi chỉnh sửa và cập nhật cấu trúc đề cương nghiên cứu.' },
  628: { name: 'UPDATE_USER_REFS_ERROR', message: 'Lỗi khi cập nhật gán tài liệu tham khảo cho người dùng.' },

  // 3. Write Report Module (630 - 642)
  630: { name: 'WRITE_CONTENT_ERROR', message: 'Lỗi khi soạn thảo nội dung báo cáo nghiên cứu.' },
  631: { name: 'ANALYZER_ERROR', message: 'Lỗi khi chạy bộ phân tích dữ liệu thống kê nghiên cứu.' },
  632: { name: 'CHUYEN_DE_1_ERROR', message: 'Lỗi khi soạn thảo nội dung chuyên đề 1.' },
  633: { name: 'CHUYEN_DE_2_ERROR', message: 'Lỗi khi soạn thảo nội dung chuyên đề 2.' },
  634: { name: 'GEN_SLIDES_ERROR', message: 'Lỗi khi sinh bài thuyết trình slide PowerPoint PPTX.' },
  635: { name: 'CHUYEN_DE_3_ERROR', message: 'Lỗi khi soạn thảo nội dung chuyên đề 3.' },
  636: { name: 'COMMENT_DATA_ERROR', message: 'Lỗi khi nhận xét và diễn giải kết quả số liệu phân tích.' },
  637: { name: 'PROPOSE_METHOD_ERROR', message: 'Lỗi khi đề xuất và hoàn thiện phương pháp nghiên cứu.' },
  638: { name: 'PARSED_VALIDATION', message: 'Lỗi kiểm tra tính hợp lệ của cấu trúc dữ liệu trả về.' },
  639: { name: 'PARSED_VALUE', message: 'Lỗi phân tích giá trị trả về từ mô hình AI.' },
  640: { name: 'DELETE_REPORT_ERROR', message: 'Lỗi khi xóa nội dung báo cáo nghiên cứu.' },
  641: { name: 'TRANSLATE_REPORT_ERROR', message: 'Lỗi khi dịch ngôn ngữ nội dung báo cáo nghiên cứu.' },
  642: { name: 'CHECK_LOGIC_DATA_ERROR', message: 'Lỗi khi kiểm tra tính logic và thống nhất của dữ liệu.' },

  // 4. Chatbot Module (650 - 653)
  650: { name: 'OUTER_CHATBOT_ERROR', message: 'Lỗi khi giao tiếp với trợ lý tư vấn học thuật chung.' },
  651: { name: 'INNER_CHATBOT_ERROR', message: 'Lỗi khi giao tiếp với chatbot trong ngữ cảnh đề tài.' },
  652: { name: 'WRITER_CHATBOT_ERROR', message: 'Lỗi trong phiên đối thoại lập kế hoạch viết với chatbot.' },
  653: { name: 'WRITER_ERROR', message: 'Lỗi trong quá trình trợ lý AI tự động soạn thảo bài viết.' },

  // 5. Enhancement Module (670 - 673)
  670: { name: 'AI_IN_DOC_ERROR', message: 'Lỗi khi áp dụng thao tác AI trực tiếp trên văn bản tài liệu.' },
  671: { name: 'GET_SUGGESTIONS_ERROR', message: 'Lỗi khi trích xuất danh sách đề xuất cải tiến văn bản.' },
  672: { name: 'ENHANCE_ERROR', message: 'Lỗi khi tối ưu hóa và tinh chỉnh đoạn văn bản được chọn.' },
  673: { name: 'ENHANCE_ALL_ERROR', message: 'Lỗi khi áp dụng đồng loạt toàn bộ các đề xuất cải tiến.' },

  // 6. Web Search Module (701 - 704)
  701: { name: 'INVALID_SEARCH_KEY', message: 'Khóa API tìm kiếm web không hợp lệ hoặc đã hết hạn.' },
  702: { name: 'SEARCH_QUOTA_LIMIT', message: 'Hạn ngạch tìm kiếm web hàng tháng đã vượt giới hạn.' },
  703: { name: 'MISSING_SEARCH_KEY', message: 'Chưa cấu hình khóa API tìm kiếm web trong hệ thống.' },
  704: { name: 'SEARCH_ERROR', message: 'Lỗi tham số hoặc không thể kết nối tới máy chủ tìm kiếm.' },
};

export function getAiErrorDetail(code: number | string): AiErrorDetail {
  const numericCode = Number(code);
  return (
    AI_ERROR_DEFINITIONS[numericCode] || {
      name: 'AI_UNKNOWN_ERROR',
      message: `Đã xảy ra lỗi AI không xác định (mã lỗi: ${code}).`,
    }
  );
}

export function getAiErrorMessage(code: number | string): string {
  return getAiErrorDetail(code).message;
}

export function getAiErrorName(code: number | string): string {
  return getAiErrorDetail(code).name;
}

export function isAiErrorCode(code: number | string): boolean {
  return Number(code) in AI_ERROR_DEFINITIONS;
}
