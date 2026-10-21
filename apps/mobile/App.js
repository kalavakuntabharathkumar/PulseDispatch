import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, View, Text, TextInput, Pressable, FlatList, StyleSheet, StatusBar } from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || "ws://localhost:4100";
export default function App() {
  const socket = useRef(null);
  const [connected, setConnected] = useState(false);
  const [sender, setSender] = useState("Rider 12");
  const [message, setMessage] = useState("");
  const [events, setEvents] = useState([]);
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    socket.current = ws;
    ws.onopen = () => { setConnected(true); ws.send(JSON.stringify({ type: "dispatch:join", room: "dispatch" })); };
    ws.onmessage = e => { try { const data = JSON.parse(e.data); if (data.type === "dispatch:message") setEvents(prev => [data, ...prev].slice(0, 100)); } catch {} };
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    return () => ws.close();
  }, []);
  function send() {
    const text = message.trim();
    if (!text || !socket.current || socket.current.readyState !== WebSocket.OPEN) return;
    socket.current.send(JSON.stringify({ type: "dispatch:message", room: "dispatch", sender, text }));
    setMessage("");
  }
  return <SafeAreaView style={styles.safe}><ExpoStatusBar style="light"/><StatusBar barStyle="light-content"/>
    <View style={styles.header}><Text style={styles.eyebrow}>DELIVERY OPERATIONS</Text><Text style={styles.title}>PulseDispatch</Text><Text style={styles.subtitle}>Rider and dispatcher coordination</Text><View style={styles.pill}><View style={[styles.dot,{backgroundColor:connected?"#43d9a3":"#ff6b7a"}]}/><Text style={styles.pillText}>{connected?"Live connection":"Connecting / offline"}</Text></View></View>
    <View style={styles.panel}><Text style={styles.section}>Dispatch channel</Text><Text style={styles.hint}>Share pickup updates, delays and handoff notes.</Text>
      <TextInput value={sender} onChangeText={setSender} placeholder="Your name" style={styles.input}/>
      <View style={styles.composer}><TextInput value={message} onChangeText={setMessage} placeholder="Write a dispatch update..." placeholderTextColor="#7e8ba2" style={[styles.input,styles.message]} multiline/><Pressable onPress={send} style={styles.send}><Text style={styles.sendText}>Send</Text></Pressable></View>
      <Text style={styles.section}>Recent messages · {events.length}</Text>
      <FlatList data={events} keyExtractor={(item,index)=>`${item.sentAt||index}-${index}`} ListEmptyComponent={<Text style={styles.empty}>No updates yet. Send a message to start the channel.</Text>} renderItem={({item})=><View style={styles.event}><View style={styles.avatar}><Text style={styles.avatarText}>{String(item.sender||"?").slice(0,1).toUpperCase()}</Text></View><View style={styles.eventBody}><Text style={styles.sender}>{item.sender}</Text><Text style={styles.eventText}>{item.text}</Text><Text style={styles.time}>{item.sentAt?new Date(item.sentAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}):"Just now"}</Text></View></View>} style={{flex:1}}/>
    </View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#101827"},header:{paddingHorizontal:22,paddingTop:24,paddingBottom:22},eyebrow:{color:"#7b9cff",fontSize:11,fontWeight:"800",letterSpacing:2},title:{color:"#fff",fontSize:30,fontWeight:"800",marginTop:8},subtitle:{color:"#a8b4c8",fontSize:14,marginTop:4},pill:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:8,backgroundColor:"#202d41",paddingHorizontal:12,paddingVertical:8,borderRadius:20,marginTop:16},dot:{width:8,height:8,borderRadius:8},pillText:{color:"#dce5f5",fontSize:12,fontWeight:"600"},panel:{flex:1,backgroundColor:"#f5f7fb",borderTopLeftRadius:26,borderTopRightRadius:26,padding:18},section:{fontSize:17,fontWeight:"800",color:"#172033",marginTop:8},hint:{color:"#6b778b",fontSize:12,marginTop:5,marginBottom:12},input:{backgroundColor:"#fff",borderWidth:1,borderColor:"#dce2ec",borderRadius:12,paddingHorizontal:13,paddingVertical:12,color:"#172033",marginBottom:10},composer:{flexDirection:"row",alignItems:"center",gap:8},message:{flex:1,minHeight:48,maxHeight:90},send:{backgroundColor:"#4f6df5",paddingHorizontal:18,paddingVertical:14,borderRadius:12,marginBottom:10},sendText:{color:"#fff",fontWeight:"800"},empty:{padding:24,textAlign:"center",color:"#78869b",lineHeight:20},event:{flexDirection:"row",gap:12,paddingVertical:14,borderBottomWidth:1,borderBottomColor:"#e0e6ef"},avatar:{width:36,height:36,borderRadius:18,backgroundColor:"#dce5ff",alignItems:"center",justifyContent:"center"},avatarText:{color:"#3655c7",fontWeight:"800"},eventBody:{flex:1},sender:{fontWeight:"800",color:"#202c40"},eventText:{color:"#344258",marginTop:3,lineHeight:20},time:{fontSize:11,color:"#8793a6",marginTop:5}
});
