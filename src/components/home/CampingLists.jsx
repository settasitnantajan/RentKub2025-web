import CampingCard from "../card/CampingCard";
import useCampingStore from "@/store/camping-store";
import EmptyList from "./EmptyList";

const CampingLists = () => {
  const campings = useCampingStore((state) => state.campings);
  // console.log(campings);

  if (campings.length === 0) {
    return <EmptyList />;
  }

  // Sort campings by averageRating in descending order
  // Handle cases where averageRating might be undefined or null
  const sortedCampings = [...campings].sort((a, b) => {
    const ratingA = typeof a.averageRating === 'number' ? a.averageRating : 0;
    const ratingB = typeof b.averageRating === 'number' ? b.averageRating : 0;
    return ratingB - ratingA; // For descending order
  });

  return (
    <section className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 mb-32">
      {sortedCampings.map((item) => {
        return <CampingCard key={item.id} camping={item} />;
      })}
    </section>
  );
};
export default CampingLists;
