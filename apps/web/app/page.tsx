"use client"
import { useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();
  return (
    <div className={styles.page}>
        <input value={roomId} placeholder="Enter room id" type="text" onChange={ (e) => {
          setRoomId(e.target.value);
        }}/>
        <button onClick={() => {
          router.push(`/room/${roomId}`);     //Here roomId is slug(a short meaningful name for a room)
        }
      }>Join Room</button>
    </div>
  );
}
