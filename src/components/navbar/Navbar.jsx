import DropdownListMenu from "./DropdownListMenu";
import Logo from "./Logo";
import Searchbar from "./Searchbar";

const Navbar = () => {
  return (
    <nav>
      <div
        className="flex flex-col items-center 
      py-4 justify-between sm:flex-row gap-4"
      >
        <Logo />
        {/* <Searchbar /> */}
        <DropdownListMenu />
      </div>
    </nav>
  );
};
export default Navbar;
