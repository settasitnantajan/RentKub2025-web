import CampingCard from "@/components/card/CampingCard";
import useCampingStore from "@/store/camping-store";
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { Link } from "react-router"; // Import Link for navigation
import Breadcrums from "@/components/campings/Breadcrums"; // Import Breadcrums
import { HeartCrack, Home } from "lucide-react"; // Import an icon for the empty state
import { Button } from "@/components/ui/button"; // Import Button for a nice CTA

const Myfavorites = () => {
  const { getToken } = useAuth();
  const actionListFavorites = useCampingStore(
    (state) => state.actionListFavorites
  );
  const favorites = useCampingStore((state) => state.favorites);

  useEffect(() => {
    const fetchFavorites = async () => {
      const token = await getToken();
      if (token) {
        actionListFavorites(token);
      }
    };
    fetchFavorites();
  }, [getToken, actionListFavorites]); // Add dependencies

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      {/* Add Breadcrumbs here */}
      <div className="mb-6"> {/* Optional: Add some margin below breadcrumbs */}
        <Breadcrums items={[{ label: "My Favorites" }]} />
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-8 text-gray-800">
        My Favorite
      </h1>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <HeartCrack size={64} className="text-gray-400 mb-6" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-3">
            No Favorites Yet!
          </h2>
          <p className="text-gray-500 mb-8 max-w-md">
            It looks like you haven't added any campings to your favorites.
            Start exploring and save the spots you love!
          </p>
          <Button asChild size="lg">
            <Link to="/">
              <Home size={20} className="mr-2" /> Explore Campings
            </Link>
          </Button>
        </div>
      ) : (
        <section className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-8">
          {favorites.map((item) => {
            // Ensure item and item.landmark exist to prevent errors
            if (!item || !item.landmark) return null;
            return <CampingCard key={item.landmark.id} camping={item.landmark} />;
          })}
        </section>
      )}
    </div>
  );
};
export default Myfavorites;
