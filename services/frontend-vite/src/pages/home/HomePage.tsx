import { useNavigate } from "react-router";
import Hero from "../../components/Hero/Hero";
import NewGame from "./NewGame";
import Divider from "../../components/Divider/Divider";
import JoinGame from "./JoinGame";

export default function HomePage() {
  const navigate = useNavigate();

  function handleCreateGame() {
    navigate("/game/new");
  }

  function handleJoinGame(code: string) {
    const link = `/game/dashboard/${code}`;
    console.log(link);
    navigate(link);
  }

  return (
    <main className="w-11/12 sm:w-10/12 max-w-2xl m-auto mt-10 sm:mt-30 px-4 sm:px-0">
      <Hero title="Wizard" subtitle="" />

      <div className="flex flex-col w-full mt-10 sm:mt-20">
        <NewGame onCreateGame={handleCreateGame} />

        <Divider text="oder" />

        <JoinGame onJoinGame={handleJoinGame} />
      </div>
    </main>
  );
}
