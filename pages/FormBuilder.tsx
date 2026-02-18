import React from 'react';
import PromptCard from '../components/PromptCard';

const promptCategories = [
  {
    category: "Thiết kế Hình ảnh & Infographic",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    prompts: [
      {
        title: "Ảnh bìa bài giảng Biển Đông",
        description: "Tạo ảnh bìa chuyên nghiệp, trực quan cho bài học về Biển Đông, phù hợp cho slide hoặc tài liệu học tập.",
        promptText: "Tạo một ảnh bìa cho bài giảng Địa lý 12 về 'Vấn đề phát triển kinh tế, an ninh, quốc phòng ở Biển Đông'. Hình ảnh cần có bản đồ Biển Đông với các quần đảo Hoàng Sa, Trường Sa, kết hợp hình ảnh tàu tuần tra và giàn khoan dầu khí. Tông màu chủ đạo là xanh dương và vàng, phong cách hiện đại, chuyên nghiệp."
      },
      {
        title: "Infographic Thiên nhiên phân hoá",
        description: "Thiết kế một infographic khổ dọc để hệ thống hoá kiến thức phức tạp về sự phân hoá tự nhiên của Việt Nam.",
        promptText: "Thiết kế một infographic khổ dọc giải thích về 'Thiên nhiên phân hoá đa dạng' ở Việt Nam. Chia làm 3 phần chính: phân hoá Bắc-Nam, phân hoá Đông-Tây, và phân hoá theo đai cao. Sử dụng icon đặc trưng cho mỗi vùng (ví dụ: hoa đào cho miền Bắc, hoa mai cho miền Nam, núi cho vùng cao). Màu sắc tươi sáng, dễ đọc."
      },
      {
        title: "Hình ảnh khái niệm 'Toàn cầu hoá'",
        description: "Tạo một hình ảnh nghệ thuật, giàu ý nghĩa để minh hoạ cho khái niệm trừu tượng về toàn cầu hoá kinh tế.",
        promptText: "Tạo một hình ảnh nghệ thuật miêu tả 'Toàn cầu hoá kinh tế'. Hình ảnh thể hiện một quả địa cầu được kết nối bởi các đường bay, tàu thuyền và các dòng dữ liệu số. Xung quanh là biểu tượng của các ngành công nghiệp và văn hoá khác nhau. Phong cách 3D, sống động."
      }
    ]
  },
  {
    category: "Thiết kế Game & Hoạt động tương tác",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>,
    prompts: [
      {
        title: "Tạo Quiz trên Kahoot/Quizizz",
        description: "Sử dụng AI để nhanh chóng tạo ra nội dung cho một game kiểm tra kiến thức trên các nền tảng phổ biến.",
        promptText: "Bạn là một chuyên gia tạo game học tập cho nền tảng Kahoot. Hãy soạn một bộ câu hỏi trắc nghiệm để nhập vào file Excel theo mẫu của Kahoot.\n\n- **Chủ đề:** [Điền chủ đề bài học]\n- **Lớp:** [Điền lớp]\n- **Số lượng câu hỏi:** [Điền số lượng]\n\n**Yêu cầu:**\n1.  Tạo chính xác [Số lượng] câu hỏi.\n2.  Mỗi câu hỏi có 4 lựa chọn, chỉ 1 đáp án đúng.\n3.  Thời gian cho mỗi câu là 20 giây.\n4.  Câu hỏi đa dạng, bám sát chương trình sách Cánh Diều.\n5.  **QUAN TRỌNG:** Trả về kết quả CHỈ LÀ một bảng Markdown duy nhất, không có lời dẫn hay giải thích gì thêm. Bảng phải có các cột sau để đảm bảo tương thích với file mẫu của Kahoot:\n\n| Câu hỏi | Đáp án 1 | Đáp án 2 | Đáp án 3 | Đáp án 4 | Thời gian (giây) | Đáp án đúng (1-4) |\n|---|---|---|---|---|---|---|\n"
      },
      {
        title: "Tạo Board Game trên Canva",
        description: "Lên kịch bản và luật chơi cho một trò chơi cờ bàn để học sinh ôn tập kiến thức một cách thú vị.",
        promptText: "Thiết kế ý tưởng cho một board game (trò chơi cờ bàn) trên Canva cho học sinh lớp 10 với chủ đề 'Hành trình khám phá các quyển của lớp vỏ địa lí'. Bàn cờ là một con đường đi qua Thạch quyển, Khí quyển, Thủy quyển, Sinh quyển. Mỗi ô sẽ là một thử thách hoặc câu hỏi kiến thức. Hãy đề xuất 5 loại ô đặc biệt (ví dụ: Mất lượt, Thưởng điểm, Thẻ may mắn) và 5 ví dụ về thẻ câu hỏi."
      },
      {
        title: "Hoạt động khởi động với Mentimeter",
        description: "Một prompt đơn giản để tạo hoạt động tương tác nhanh, thu hút sự chú ý của học sinh vào đầu giờ học.",
        promptText: "Tạo một hoạt động Word Cloud trên Mentimeter với câu hỏi: 'Khi nhắc đến 'Đồng bằng sông Cửu Long', em nghĩ đến những từ khoá nào?'. Sử dụng hoạt động này để khởi động bài học và khảo sát kiến thức nền của học sinh."
      }
    ]
  },
  {
    category: "Thiết kế Video từ AI (VEO)",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
    prompts: [
      {
        title: "Video Hyperlapse về Đô thị hoá",
        description: "Tạo một video ngắn, ấn tượng trực quan để minh hoạ cho quá trình đô thị hoá diễn ra nhanh chóng.",
        promptText: "Tạo một video 30 giây, phong cách hyperlapse, mô tả quá trình đô thị hoá ở Việt Nam. Bắt đầu với cảnh một vùng nông thôn yên bình với ruộng lúa, sau đó các toà nhà cao tầng, đường cao tốc và khu công nghiệp dần dần mọc lên. Video có tông màu tươi sáng, hiện đại, tốc độ nhanh."
      },
      {
        title: "Video Drone Shot Duyên hải Nam Trung Bộ",
        description: "Sử dụng AI tạo video để có những thước phim đẹp như thật về cảnh quan Việt Nam, phục vụ cho bài giảng.",
        promptText: "Một video góc rộng từ trên cao (drone shot) bay dọc theo dải Duyên hải Nam Trung Bộ của Việt Nam. Video thể hiện rõ các bãi biển cát trắng, các đầm phá, các cảng biển sầm uất và các cánh đồng muối. Thời gian trong video là bình minh, ánh nắng vàng rực rỡ, chất lượng 4K."
      },
      {
        title: "Video Hoạt hình về Chuyển động Trái Đất",
        description: "Minh hoạ các kiến thức thiên văn trừu tượng bằng một video hoạt hình 3D khoa học và dễ hiểu.",
        promptText: "Tạo một video hoạt hình 3D dài 1 phút, không lời, mô tả chuyển động của Trái Đất quanh Mặt Trời và hệ quả của nó. Thể hiện rõ trục nghiêng 23.5 độ của Trái Đất, sự thay đổi của các mùa ở hai bán cầu, và hiện tượng ngày đêm dài ngắn khác nhau. Phong cách hoạt hình khoa học, chính xác, có các nhãn chú thích (text label) cho 'Mùa hè', 'Mùa đông', 'Xuân phân', 'Thuân'."
      }
    ]
  },
  {
    category: "Công cụ AI cho Giáo viên",
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    prompts: [
      {
        title: "Soạn giáo án chi tiết",
        description: "Tiết kiệm thời gian chuẩn bị bài giảng bằng cách để AI soạn thảo một giáo án hoàn chỉnh theo yêu cầu.",
        promptText: "Bạn là một giáo viên Địa lý giàu kinh nghiệm. Hãy soạn một giáo án chi tiết cho bài 'Thiên nhiên nhiệt đới ẩm gió mùa' (Địa lý 12) trong 45 phút. Giáo án cần có các hoạt động: khởi động (5 phút), hình thành kiến thức mới (25 phút, sử dụng kỹ thuật sơ đồ tư duy), luyện tập (10 phút, gợi ý 5 câu hỏi trắc nghiệm nhanh), và vận dụng (5 phút, giao bài tập về nhà). Tích hợp các câu hỏi gợi mở để khuyến khích học sinh tư duy."
      },
      {
        title: "Tạo câu hỏi thảo luận nhóm",
        description: "Thúc đẩy tư duy phản biện và kỹ năng làm việc nhóm của học sinh với các câu hỏi thảo luận sâu sắc.",
        promptText: "Tạo 5 câu hỏi thảo luận nhóm (mức độ vận dụng và vận dụng cao) cho bài học 'Toàn cầu hoá và khu vực hoá kinh tế' (Địa lý 11). Các câu hỏi cần khuyến khích học sinh tranh luận về cơ hội và thách thức của toàn cầu hoá đối với Việt Nam, lấy ví dụ từ các công ty như Vinfast, Samsung, hoặc ngành dệt may."
      },
       {
        title: "Tóm tắt tài liệu",
        description: "Nhanh chóng nắm bắt ý chính từ các bài báo, tài liệu dài để cập nhật kiến thức hoặc chuẩn bị tài liệu cho học sinh.",
        promptText: "Tóm tắt bài viết khoa học sau đây về tác động của biến đổi khí hậu đến Đồng bằng sông Cửu Long thành 5 gạch đầu dòng chính, ngôn ngữ dễ hiểu cho học sinh lớp 12. [Dán nội dung bài viết vào đây]."
      }
    ]
  }
];

const FormBuilder: React.FC = () => {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900">Thư viện Prompt Sáng tạo</h2>
        <p className="mt-2 text-gray-600 max-w-3xl">
          Khám phá và sao chép các câu lệnh (prompt) mẫu được thiết kế chuyên biệt cho giáo viên Địa lý. Sử dụng chúng với các công cụ AI khác như Gemini, Canva, Veo... để nhanh chóng tạo ra tài nguyên dạy học chất lượng cao.
        </p>
      </div>

      {promptCategories.map((categoryData, index) => (
        <div key={index} className="card p-6 md:p-8">
          <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-gray-100 rounded-full">
                  {categoryData.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{categoryData.category}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryData.prompts.map((prompt, pIndex) => (
              <PromptCard
                key={pIndex}
                title={prompt.title}
                description={prompt.description}
                promptText={prompt.promptText}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FormBuilder;