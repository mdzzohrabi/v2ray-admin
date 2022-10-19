import { useContext } from "react";
import { AppContext } from "../components/app-context";

export default function LogoutPage() {
    let context = useContext(AppContext);
    context.setServer({ url: '', token: '' });
    return 'Logout successful...';
}