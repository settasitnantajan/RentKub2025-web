import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router";

const ProtectRoute = ({ eL }) => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <h1>Loading...</h1>;
  }

  if (!isSignedIn) {
    return (
      <div className="flex w-screen h-screen justify-center items-center bg-gray-100">
        <p>
          Access Denied!!! Go to{" "}
          <Link to="/" className="text-blue-500 underline">
            Home
          </Link>
        </p>
      </div>
    );
  }

  return eL;
};
export default ProtectRoute;
