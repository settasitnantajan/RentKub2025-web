import { useUser } from "@clerk/clerk-react";
import logo from '../assets/logo.png';
import Breadcrums from "../components/campings/Breadcrums"; // Import the Breadcrums component

const About = () => {
  const { isSignedIn } = useUser();
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Add Breadcrumbs here */}
      <div className="container mx-auto px-6 py-3"> {/* Container for breadcrumbs with top padding */}
        <Breadcrums items={[{ label: "About" }]} />
      </div>
      <header className="bg-gray-400 text-white shadow-lg">
        <div className="container mx-auto px-6 py-10 text-center"> {/* Adjusted padding for logo */}
          <img
            src={logo} // Replace with your actual logo path e.g., import logo from '../assets/logo.png'; and use {logo}
            alt="RentKub Logo"
            className="h-16 w-auto mx-auto mb-4" // Adjust size (h-16) and margin as needed
          />
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Welcome to RentKub
          </h1>
          <p className="mt-4 text-lg md:text-xl">
            Discover unique places to stay and share your own special properties with a vibrant community of travelers.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Our Mission</h2>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto text-center">
            At RentKub, our mission is to connect people with unique accommodations and each other by making diverse stays accessible to everyone. We believe in the power of shared experiences and the comfort of finding the perfect place to call home, even just for a while.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center">What We Offer</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-semibold text-rose-500 mb-3">For Travelers & Guests</h3>
              <p className="text-gray-700 leading-relaxed">
                Explore a diverse range of unique accommodations, from cozy apartments and private rooms to entire homes and vacation rentals. Find your perfect stay, book with ease, and get ready to explore new destinations.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-semibold text-rose-500 mb-3">For Property Owners & Hosts</h3>
              <p className="text-gray-700 leading-relaxed">
                Share your unique piece of land or property with a community of respectful travelers. Earn extra income, meet interesting people, and help others discover the joy of the outdoors. Listing is simple and secure.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Our Community</h2>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto text-center">
            RentKub is more than just a platform; it's a community built on trust, respect, and a shared love for travel and unique experiences. We encourage responsible hosting and traveling and strive to foster positive connections between hosts and guests.
          </p>
        </section>

        <section className="text-center py-10 bg-blue-400 text-white rounded-lg shadow-lg">
          <h2 className="text-3xl font-semibold mb-4">Ready to Find a Stay or Become a Host?</h2>
          <p className="text-lg mb-8 max-w-xl mx-auto">
            Join the RentKub community today. Your next travel experience or hosting opportunity awaits!
          </p>
          <div className="space-x-4">
            <a href="/" className="bg-white text-rose-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors text-lg">Explore</a>
            <a
              href={isSignedIn ? "/admin/camping" : "/sign-in"} // Or your specific sign-in/sign-up route
              className="border-2 border-white text-white font-semibold py-3 px-6 rounded-lg hover:bg-white hover:text-rose-600 transition-colors text-lg"
            >
              Become a Host
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};
export default About;