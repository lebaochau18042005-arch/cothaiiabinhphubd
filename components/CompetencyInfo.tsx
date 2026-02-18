
import React, { useState } from 'react';

const competencyDetails = {
  NL1: {
    name: 'Nhận thức tư duy tổng hợp theo lãnh thổ',
    description: 'Năng lực phân tích, giải thích và tổng hợp các mối liên hệ giữa các sự vật, hiện tượng địa lí trong một không gian lãnh thổ cụ thể.',
  },
  NL2: {
    name: 'Nhận thức không gian',
    description: 'Năng lực xác định vị trí, phân bố và mối liên hệ không gian của các đối tượng địa lí, chủ yếu thông qua bản đồ và các công cụ trực quan.',
  },
  NL3: {
    name: 'Năng lực tính toán và sử dụng công cụ địa lí',
    description: 'Bao gồm: Tính toán các chỉ số đặc thù (mật độ, tỉ trọng, múi giờ, hải lí...) ở mức độ hiểu và vận dụng (tính toán 2 bước); vẽ và nhận xét biểu đồ, Atlat.',
  },
  NL4: {
    name: 'Vận dụng tri thức vào thực tiễn',
    description: 'Năng lực áp dụng kiến thức, kỹ năng địa lí để giải quyết các vấn đề thực tiễn trong đời sống, sản xuất và bảo vệ môi trường.',
  },
};

const CompetencyInfo: React.FC = () => {
  const [hoveredCompetency, setHoveredCompetency] = useState<keyof typeof competencyDetails | null>(null);

  return (
    <div className="mt-2 text-sm text-gray-600">
      <div className="flex items-center space-x-4">
        <span>Mã năng lực (NL):</span>
        {Object.keys(competencyDetails).map(key => (
          <div 
            key={key} 
            className="relative"
            onMouseEnter={() => setHoveredCompetency(key as keyof typeof competencyDetails)}
            onMouseLeave={() => setHoveredCompetency(null)}
          >
            <span className="font-semibold text-indigo-600 cursor-pointer border-b-2 border-dotted border-indigo-400">
              {key}
            </span>
            {hoveredCompetency === key && (
              <div className="absolute bottom-full mb-2 w-72 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10 transition-opacity duration-300">
                <p className="font-bold">{competencyDetails[key as keyof typeof competencyDetails].name}</p>
                <p className="mt-1">{competencyDetails[key as keyof typeof competencyDetails].description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompetencyInfo;
