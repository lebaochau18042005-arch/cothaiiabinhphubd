
export interface Unit {
  name: string;
}

export interface Chapter {
  name:string;
  units: Unit[];
}

export interface GradeCurriculum {
  grade: '10' | '11' | '12';
  chapters: Chapter[];
}

export const curriculumData: GradeCurriculum[] = [
    // Lớp 10 - Cập nhật theo SGK Địa Lý Cánh Diều
    {
        grade: '10',
        chapters: [
            { 
                name: 'Một số vấn đề chung', 
                units: [
                    { name: 'Bài 1: Môn Địa lí với định hướng nghề nghiệp' },
                    { name: 'Bài 2: Sử dụng bản đồ' },
                ]
            },
            { 
                name: 'Chương 1: Trái Đất', 
                units: [
                    { name: 'Bài 3: Trái Đất. Thuyết kiến tạo mảng' },
                    { name: 'Bài 4: Hệ quả địa lí các chuyển động chính của Trái Đất' },
                ]
            },
            { 
                name: 'Chương 2: Thạch quyển', 
                units: [
                    { name: 'Bài 5: Thạch quyển. Nội lực và tác động của nội lực đến địa hình bề mặt Trái Đất' },
                    { name: 'Bài 6: Ngoại lực và tác động của ngoại lực đến địa hình bề mặt Trái Đất' },
                ]
            },
            { 
                name: 'Chương 3: Khí quyển', 
                units: [
                    { name: 'Bài 7: Khí quyển. Nhiệt độ không khí' },
                    { name: 'Bài 8: Khí áp, gió và mưa' },
                    { name: 'Bài 9: Thực hành: Đọc bản đồ các đới khí hậu trên Trái Đất. Phân tích biểu đồ một số kiểu khí hậu' },
                ]
            },
            { 
                name: 'Chương 4: Thủy quyển', 
                units: [
                    { name: 'Bài 10: Thủy quyển. Nước trên lục địa' },
                    { name: 'Bài 11: Nước biển và đại dương' },
                ]
            },
            { 
                name: 'Chương 5: Sinh quyển', 
                units: [
                    { name: 'Bài 12: Đất và sinh quyển' },
                    { name: 'Bài 13: Thực hành: Phân tích bản đồ, sơ đồ về phân bố của đất và sinh vật trên thế giới' },
                ]
            },
            { 
                name: 'Chương 6: Một số quy luật của vỏ địa lí', 
                units: [
                    { name: 'Bài 14: Vỏ địa lí. Quy luật thống nhất và hoàn chỉnh' },
                    { name: 'Bài 15: Quy luật địa đới và quy luật phi địa đới' },
                ]
            },
            { 
                name: 'Chương 7: Địa lí dân cư', 
                units: [
                    { name: 'Bài 16: Dân số và gia tăng dân số. Cơ cấu dân số' },
                    { name: 'Bài 17: Phân bố dân cư và đô thị hóa' },
                ]
            },
            { 
                name: 'Chương 8: Các nguồn lực, một số tiêu chí đánh giá sự phát triển kinh tế', 
                units: [
                    { name: 'Bài 18: Các nguồn lực phát triển kinh tế' },
                    { name: 'Bài 19: Cơ cấu nền kinh tế, tổng sản phẩm quốc nội và tổng thu nhập quốc gia' },
                ]
            },
            { 
                name: 'Chương 9: Địa lí các ngành kinh tế', 
                units: [
                    { name: 'Bài 20: Vai trò, đặc điểm, các nhân tố ảnh hưởng đến sự phát triển và phân bố nông nghiệp, lâm nghiệp, thủy sản' },
                    { name: 'Bài 21: Địa lí các ngành nông nghiệp, lâm nghiệp, thủy sản' },
                    { name: 'Bài 22: Tổ chức lãnh thổ nông nghiệp' },
                    { name: 'Bài 23: Vai trò, đặc điểm, cơ cấu, các nhân tố ảnh hưởng đến sự phát triển và phân bố công nghiệp' },
                    { name: 'Bài 24: Địa lí một số ngành công nghiệp' },
                    { name: 'Bài 25: Tổ chức lãnh thổ công nghiệp' },
                    { name: 'Bài 26: Vai trò, đặc điểm, cơ cấu, các nhân tố ảnh hưởng đến sự phát triển và phân bố dịch vụ' },
                    { name: 'Bài 27: Địa lí giao thông vận tải và bưu chính viễn thông' },
                    { name: 'Bài 28: Thương mại, tài chính ngân hàng và du lịch' },
                ]
            },
            { 
                name: 'Chương 10: Phát triển bền vững và tăng trưởng xanh', 
                units: [
                    { name: 'Bài 29: Môi trường và tài nguyên thiên nhiên' },
                    { name: 'Bài 30: Phát triển bền vững và tăng trưởng xanh' },
                ]
            },
        ],
    },
    // Lớp 11 - Cập nhật theo Phân phối chương trình 2025-2026 sách Cánh Diều
    {
        grade: '11',
        chapters: [
            { name: 'MỘT SỐ VẤN ĐỀ VỀ KINH TẾ - XÃ HỘI THẾ GIỚI', units: [
                { name: 'Bài 1. Sự khác biệt về trình độ phát triển kinh tế - xã hội của các nhóm nước' },
                { name: 'Bài 2. Toàn cầu hóa, khu vực hóa kinh tế' },
                { name: 'Bài 3. Một số tổ chức khu vực và quốc tế' },
                { name: 'Bài 4. Thực hành: Tìm hiểu về toàn cầu hóa, khu vực hóa' },
                { name: 'Bài 5. Một số vấn đề an ninh toàn cầu' },
                { name: 'Bài 6. Thực hành: Viết báo cáo về nền kinh tế tri thức' },
            ]},
            { name: 'KHU VỰC MỸ LA-TINH', units: [
                { name: 'Bài 7. Vị trí địa lí, điều kiện tự nhiên, dân cư, xã hội và kinh tế khu vực Mỹ la-tinh' },
                { name: 'Bài 8. Thực hành: Viết báo cáo về tình hình phát triển kinh tế - xã hội ở Cộng hoà Liên bang Bra-xin' },
            ]},
            { name: 'LIÊN MINH CHÂU ÂU (EU)', units: [
                { name: 'Bài 9. EU - Một liên kết kinh tế khu vực lớn. Vị thế của EU trong nền kinh tế thế giới' },
                { name: 'Bài 10. Thực hành: Viết báo cáo về công nghiệp của Cộng hòa Liên bang Đức' },
            ]},
            { name: 'KHU VỰC ĐÔNG NAM Á', units: [
                { name: 'Bài 11. Vị trí địa lí, điều kiện tự nhiên, dân cư, xã hội và kinh tế khu vực Đông Nam Á' },
                { name: 'Bài 12. Hiệp hội các quốc gia Đông Nam Á (ASEAN)' },
                { name: 'Bài 13. Thực hành: Tìm hiểu về hoạt động du lịch và kinh tế đối ngoại của khu vực Đông Nam Á' },
            ]},
            { name: 'KHU VỰC TÂY NAM Á', units: [
                { name: 'Bài 14. Vị trí địa lí, điều kiện tự nhiên, dân cư, xã hội và kinh tế khu vực Tây Nam Á' },
                { name: 'Bài 15. Thực hành: Viết báo cáo về vấn đề dầu mỏ ở khu vực Tây Nam Á' },
            ]},
            { name: 'HỢP CHÚNG QUỐC HOA KỲ (HOA KỲ)', units: [
                { name: 'Bài 16. Vị trí địa lí, điều kiện tự nhiên và dân cư, xã hội Hoa Kỳ' },
                { name: 'Bài 17. Kinh tế Hoa Kỳ' },
                { name: 'Bài 18. Thực hành: Tìm hiểu về hoạt động xuất, nhập khẩu của Hoa Kỳ' },
            ]},
            { name: 'LIÊN BANG NGA', units: [
                { name: 'Bài 19. Vị trí địa lí, điều kiện tự nhiên và dân cư, xã hội Liên bang Nga' },
                { name: 'Bài 20. Kinh tế Liên bang Nga' },
                { name: 'Bài 21. Thực hành: Tìm hiểu về công nghiệp khai thác dầu khí của Liên bang Nga' },
            ]},
            { name: 'NHẬT BẢN', units: [
                { name: 'Bài 22. Vị trí địa lí, điều kiện tự nhiên, dân cư và xã hội Nhật Bản' },
                { name: 'Bài 23. Kinh tế Nhật Bản' },
                { name: 'Bài 24. Thực hành: Viết báo cáo về hoạt động kinh tế đối ngoại của Nhật Bản' },
            ]},
            { name: 'CỘNG HOÀ NHÂN DÂN TRUNG HOA (TRUNG QUỐC)', units: [
                { name: 'Bài 25. Vị trí địa lí, điều kiện tự nhiên, dân cư và xã hội Trung Quốc' },
                { name: 'Bài 26. Kinh tế Trung Quốc' },
                { name: 'Bài 27. Thực hành: Viết báo cáo về sự thay đổi của nền kinh tế Trung Quốc' },
            ]},
            { name: 'Ô-XTRÂY-LI-A', units: [
                { name: 'Bài 28. Thực hành: Đọc bản đồ; phân tích số liệu, tư liệu và viết báo cáo về tình hình phát triển kinh tế Ô-xtrây-li-a' },
            ]},
            { name: 'CỘNG HOÀ NAM PHI', units: [
                { name: 'Bài 29. Vị trí địa lí, điều kiện tự nhiên, dân cư và xã hội Cộng hoà Nam Phi' },
                { name: 'Bài 30. Kinh tế Cộng hoà Nam Phi' },
                { name: 'Bài 31. Thực hành: Tìm hiểu về công nghiệp khai thác khoáng sản của Cộng hòa Nam Phi' },
            ]},
            { name: 'Chuyên đề lựa chọn', units: [
                { name: 'Chuyên đề 1. Một số vấn đề về khu vực Đông Nam Á' },
                { name: 'Chuyên đề 2. Một số vấn đề về du lịch thế giới' },
                { name: 'Chuyên đề 3. Cuộc cách mạng công nghiệp lần thứ tư (4.0)' },
            ]},
        ],
    },
    // Lớp 12 - Cập nhật theo kế hoạch giảng dạy
    {
        grade: '12',
        chapters: [
            {
                name: 'CHƯƠNG 1. ĐỊA LÍ TỰ NHIÊN',
                units: [
                    { name: 'Bài 1. Vị trí địa lí và phạm vi lãnh thổ' },
                    { name: 'Bài 2. Thiên nhiên nhiệt đới ẩm gió mùa và ảnh hưởng đến sản xuất, đời sống' },
                    { name: 'Bài 3. Sự phân hoá đa dạng của thiên nhiên' },
                    { name: 'Bài 4. Thực hành: Trình bày báo cáo về sự phân hoá tự nhiên Việt Nam' },
                    { name: 'Bài 5. Vấn đề sử dụng hợp lí tài nguyên thiên nhiên và bảo vệ môi trường' },
                ]
            },
            {
                name: 'CHƯƠNG 2. ĐỊA LÍ DÂN CƯ',
                units: [
                    { name: 'Bài 6. Dân số, lao động và việc làm' },
                    { name: 'Bài 7. Đô thị hoá' },
                    { name: 'Bài 8. Thực hành: Viết báo cáo về dân số, lao động và việc làm, đô thị hoá' },
                ]
            },
            {
                name: 'CHƯƠNG 3. ĐỊA LÍ CÁC NGÀNH KINH TẾ',
                units: [
                    { name: 'Bài 9. Chuyển dịch cơ cấu kinh tế' },
                    { name: 'Bài 10. Vấn đề phát triển nông nghiệp, lâm nghiệp và thuỷ sản' },
                    { name: 'Bài 11. Một số hình thức tổ chức lãnh thổ nông nghiệp' },
                    { name: 'Bài 12. Thực hành: Vẽ biểu đồ, nhận xét và giải thích về tình hình phát triển và sự chuyển dịch cơ cấu của ngành nông nghiệp, lâm nghiệp và thuỷ sản' },
                    { name: 'Bài 13. Vấn đề phát triển công nghiệp' },
                    { name: 'Bài 14. Một số hình thức tổ chức lãnh thổ công nghiệp' },
                    { name: 'Bài 15. Thực hành: Vẽ biểu đồ, nhận xét và giải thích tình hình phát triển các ngành công nghiệp ở nước ta' },
                    { name: 'Bài 16. Giao thông vận tải và bưu chính viễn thông' },
                    { name: 'Bài 17. Thương mại và du lịch' },
                    { name: 'Bài 18. Thực hành: Tìm hiểu thực tế về một số hoạt động và sản phẩm dịch vụ của địa phương' },
                ]
            },
            {
                name: 'CHƯƠNG 4. ĐỊA LÍ CÁC VÙNG KINH TẾ - XÃ HỘI',
                units: [
                    { name: 'Bài 19. Khai thác thế mạnh ở Trung du và miền núi phía Bắc' },
                    { name: 'Bài 20. Phát triển kinh tế - xã hội ở Đồng bằng sông Hồng' },
                    { name: 'Bài 21. Phát triển kinh tế - xã hội ở Bắc Trung Bộ' },
                    { name: 'Bài 22+23. Phát triển kinh tế - xã hội ở Nam Trung Bộ' },
                    { name: 'Bài 24. Phát triển kinh tế - xã hội ở Đông Nam Bộ' },
                    { name: 'Bài 25. Sử dụng hợp lí tự nhiên để phát triển kinh tế ở Đồng bằng sông Cửu Long' },
                    { name: 'Bài 26. Thực hành: Tìm hiểu ảnh hưởng của biến đổi khí hậu đối với Đồng bằng sông Cửu Long và các giải pháp ứng phó' },
                    { name: 'Bài 28. Phát triển kinh tế và đảm bảo an ninh quốc phòng ở Biển Đông và các đảo, quần đảo' },
                    { name: 'Bài 29. Thực hành: Viết và trình bày báo cáo tuyên truyền về bảo vệ chủ quyền biển đảo của Việt Nam' },
                    { name: 'Bài 30. Thực hành: Tìm hiểu địa lí địa phương' },
                ]
            },
        ],
    },
];
