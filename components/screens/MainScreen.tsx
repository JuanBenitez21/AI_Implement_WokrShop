import { GeminiResponse } from '@/types/response.types'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function MainScreen() {

    const [textInput, setTextInput] = useState("How does AI work in few words?")
    const [isLoading, setIsLoading] = useState(false)
    const [responseData, setResponseData] =useState("")


    useEffect(() => {
        getIAResponse()
    }, [])
    
    const getIAResponse = async () => {
        const body = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": textInput
                        }
                    ]
                }
            ]
        }
        try {
            setIsLoading(true)
            const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
                method: "POST",
                headers: {
                    'x-goog-api-key': process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            const data: GeminiResponse = await response.json();
 
            setResponseData(data.candidates[0].content.parts[0].text);
 
            console.log(JSON.stringify(data, null, 2))
 
        } catch (error) {
            console.log(error)
            
        }finally {
            setIsLoading(false)
        }
    }


  return (
    <SafeAreaView
    style={{
        flex: 1,
        backgroundColor: "#fff",
    }}
    >
        {
            ! isLoading ? 
            <ScrollView
            style={{
                flex: 1,
                padding: 20,
            }}
            >
                <Text>{responseData}</Text>
            </ScrollView>
            :
            <View
            style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
            }}
            >
                <ActivityIndicator size="large" color="#000" />
                <Text>Loading...</Text>
            </View>
        }
    </SafeAreaView>
  )
}