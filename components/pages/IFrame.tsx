import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import { StyleSheet } from 'react-native';

export default function IFrame() {
    return (
        <WebView
            style={styles.container}
            source={{ uri: 'https://deviprasadkl.github.io/Logout_legend' }}
        />
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop:25
    },
});