import { Link } from "react-router";
import { Button } from "../ui/button";
import rentkubLogo from "../../assets/RENTKUB-horizontal.png";

const Logo = () => {
  return (
    <Button asChild variant>
      <Link to="/">
        <img className="h-10 w-32" src={rentkubLogo} alt="RentKub" />
      </Link>
    </Button>
  );
};
export default Logo;
