import { PROPERTIES } from '../../../constants/data';
import PropertyCard from '../components/PropertyCard';

export default function PropertyGrid() {
  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="my-[18px] mb-3 flex items-center gap-2.5" aria-label="智能房源推薦">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E6EDF7] bg-gradient-to-b from-white to-[#F6F9FF] px-3 py-1.5 text-sm font-black tracking-[0.2px] text-[#00385a]">
          <span className="grid size-[18px] place-items-center rounded-md bg-gradient-to-b from-[#00385a] to-[#004E7C] text-xs font-black text-white shadow-[0_2px_6px_rgba(0,56,90,0.18)]">
            ★
          </span>
          <span className="text-base leading-none md:text-lg md:font-bold">〔智能房源推薦〕</span>
          <span className="ml-1.5 text-sm font-bold text-[#6C7B91]">依瀏覽行為與社區口碑輔助排序</span>
        </div>
        <div
          className="animate-mhRecoBar ml-2.5 h-1.5 flex-1 rounded-full bg-gradient-to-r from-[#00385a] via-[#004E7C] to-[#7EA5FF] bg-[length:200%_100%] opacity-25"
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
