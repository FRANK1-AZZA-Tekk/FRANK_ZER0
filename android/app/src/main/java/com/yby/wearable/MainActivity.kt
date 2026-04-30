package com.yby.wearable

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import kotlinx.coroutines.launch
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject
import android.content.Context
import android.media.MediaPlayer
import androidx.compose.ui.platform.LocalContext
import java.io.File

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            YBYTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = Color(0xFF0A0A0A)) {
                    YBYOrbUI()
                }
            }
        }
    }
}

@Composable
fun YBYTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFF00FF88),
            background = Color(0xFF0A0A0A),
            surface = Color(0xFF141414)
        ),
        content = content
    )
}

enum class OrbState {
    READY, LISTENING, PROCESSING
}

@Composable
fun YBYOrbUI() {
    var orbState by remember { mutableStateOf(OrbState.READY) }
    var responseText by remember { mutableStateOf("Aguardando comando...") }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val mediaPlayer = remember { MediaPlayer() }

    val animatedElevation by animateDpAsState(
        targetValue = when (orbState) {
            OrbState.LISTENING -> 60.dp
            OrbState.PROCESSING -> 35.dp
            OrbState.READY -> 10.dp
        },
        animationSpec = tween(durationMillis = 600)
    )

    val animatedColor by animateColorAsState(
        targetValue = when (orbState) {
            OrbState.LISTENING -> Color(0xFF00FF88).copy(alpha = 0.6f)
            OrbState.PROCESSING -> Color(0xFF00AAFF).copy(alpha = 0.5f)
            OrbState.READY -> Color(0xFF1A1A1A)
        },
        animationSpec = tween(durationMillis = 600)
    )

    val animatedOrbTextColor by animateColorAsState(
        targetValue = when (orbState) {
            OrbState.LISTENING -> Color.White
            OrbState.PROCESSING -> Color(0xFFE0E0E0)
            OrbState.READY -> Color(0xFF00FF88).copy(alpha = 0.7f)
        },
        animationSpec = tween(durationMillis = 600)
    )

    val orbText = when (orbState) {
        OrbState.LISTENING -> "OUVINDO..."
        OrbState.PROCESSING -> "CORTEX LENDO..."
        OrbState.READY -> "PRONTO"
    }

    fun playAudio(audioUrl: String) {
        try {
            mediaPlayer.reset()
            mediaPlayer.setDataSource(audioUrl)
            mediaPlayer.prepare()
            mediaPlayer.start()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "YBY CORTEX",
            color = Color(0xFF00FF88),
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 4.sp
        )
        Spacer(modifier = Modifier.height(64.dp))
        
        Button(
            onClick = { },
            modifier = Modifier
                .size(200.dp)
                .shadow(
                    elevation = animatedElevation,
                    shape = CircleShape,
                    ambientColor = Color(0xFF00FF88),
                    spotColor = Color(0xFF00FF88)
                )
                .pointerInput(Unit) {
                    detectTapGestures(
                        onLongPress = {
                            orbState = OrbState.LISTENING
                            responseText = "Escaneando arredores..."
                            scope.launch {
                                // Simulate transition to processing
                                kotlinx.coroutines.delay(1000)
                                orbState = OrbState.PROCESSING
                                val (text, audioUrl) = sendVoiceCommand("YBY analise o ambiente", context)
                                responseText = text
                                audioUrl?.let { playAudio(it) }
                                orbState = OrbState.READY
                            }
                        },
                        onTap = {
                            orbState = OrbState.LISTENING
                            responseText = "Ouvindo YBY..."
                            scope.launch {
                                kotlinx.coroutines.delay(800)
                                orbState = OrbState.PROCESSING
                                val (text, audioUrl) = sendVoiceCommand("YBY oi", context)
                                responseText = text
                                audioUrl?.let { playAudio(it) }
                                orbState = OrbState.READY
                            }
                        }
                    )
                },
            colors = ButtonDefaults.buttonColors(
                containerColor = animatedColor
            ),
            shape = CircleShape
        ) {
            Text(
                text = orbText,
                color = animatedOrbTextColor,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
        }
        
        Spacer(modifier = Modifier.height(64.dp))
        Text(
            text = responseText,
            color = Color.White,
            fontSize = 16.sp,
            modifier = Modifier.padding(16.dp)
        )
    }
}

suspend fun sendVoiceCommand(text: String, context: Context): Pair<String, String?> {
    return kotlinx.coroutines.Dispatchers.IO.run {
        try {
            val url = URL("http://192.168.x.x:8000/api/v1/swarm/voice")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true
            
            val jsonInputString = JSONObject().put("audio_text", text).toString()
            conn.outputStream.use { os ->
                val input = jsonInputString.toByteArray(Charsets.UTF_8)
                os.write(input, 0, input.size)
            }
            
            val responseCode = conn.responseCode
            val ybyResponse = if (responseCode == 200) {
                val response = conn.inputStream.bufferedReader().use { it.readText() }
                JSONObject(response).getString("yby_response")
            } else {
                "Erro: $responseCode"
            }

            var audioUrl: String? = null
            if (responseCode == 200) {
                try {
                    val voiceId = "pNInz6obpgmqS2at6vmg"
                    val ttsUrl = URL("https://api.elevenlabs.io/v1/text-to-speech/$voiceId/stream")
                    val ttsConn = ttsUrl.openConnection() as HttpURLConnection
                    ttsConn.requestMethod = "POST"
                    ttsConn.setRequestProperty("Content-Type", "application/json")
                    // ttsConn.setRequestProperty("xi-api-key", "YOUR_API_KEY") // Add API key here if needed
                    ttsConn.doOutput = true

                    val ttsInput = JSONObject().put("text", ybyResponse).toString()
                    ttsConn.outputStream.use { os ->
                        val input = ttsInput.toByteArray(Charsets.UTF_8)
                        os.write(input, 0, input.size)
                    }

                    if (ttsConn.responseCode == 200) {
                        val tempFile = File.createTempFile("yby_voice", ".mp3", context.cacheDir)
                        tempFile.outputStream().use { fileOut ->
                            ttsConn.inputStream.copyTo(fileOut)
                        }
                        audioUrl = tempFile.absolutePath
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            Pair(ybyResponse, audioUrl)
        } catch (e: Exception) {
            Pair("Falha na conexão: ${e.message}", null)
        }
    }
}
