import React from 'react'; // Import React

// Use React.lazy for dynamic import
const CampingContainer = React.lazy(() => import("@/components/home/CampingContainer"));

const Home = () => {
  return (
    <div>
      <CampingContainer /> {/* Use the lazy-loaded component */}
    </div>
  );
};
export default Home;
