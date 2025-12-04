import { PROPERTIES } from '../../../constants/data';
import PropertyCard from '../components/PropertyCard';

export default function PropertyGrid() {
  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex items-center gap-2.5 my-[18px] mb-3" aria-label="智能房源推薦">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#E6EDF7] rounded-full bg-gradient-to-b from-white to-[#F6F9FF] text-[#00385a] font-black text-sm tracking-[0.2px]">
          <span className="w-[18px] h-[18px] rounded-md grid place-items-center bg-gradient-to-b from-[#00385a] to-[#004E7C] text-white text-xs font-black shadow-[0_2px_6px_rgba(0,56,90,0.18)]">
            ★
          </span>
          <span className="leading-none text-base md:text-lg md:font-bold">〔智能房源推薦〕</span>
          <span className="ml-1.5 text-sm text-[#6C7B91] font-bold">依瀏覽行為與社區口碑輔助排序</span>
        </div>
        <div
          className="h-1.5 rounded-full flex-1 bg-gradient-to-r from-[#00385a] via-[#004E7C] to-[#7EA5FF] bg-[length:200%_100%] opacity-25 ml-2.5 animate-mhRecoBar"
          aria-hidden="true"
        />
      </div>

      {/* Grid Section */}
      <div
        className="grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-3"
        aria-label="房源清單"
        title="房源清單"
      >
        {PROPERTIES.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
