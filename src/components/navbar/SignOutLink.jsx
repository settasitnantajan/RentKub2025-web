import { SignOutButton } from "@clerk/clerk-react"
import { toast } from "sonner"

const SignOutLink = () => {

    const handleLogoutOut = () => {
        toast("LogOut Successfully")
    }

  return (
    <SignOutButton redirectUrl="/">
        <button onClick={handleLogoutOut}>
            Logout
        </button>
    </SignOutButton>
  )
}
export default SignOutLink