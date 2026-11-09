let accessToken = null;
const clientId = '62047903d6b54c068b87679e10e44e77';
const redirectUri = 'http://127.0.0.1:3000/';
const scopes = [
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-private'
];
const authorizeEndpoint = 'https://accounts.spotify.com/authorize';
const tokenEndpoint = 'https://accounts.spotify.com/api/token';
let userId = '';

/*
* Generate the random verifier used by PKCE.
*/
const generateRandomString = (length) => {
    const possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    const values = crypto.getRandomValues(new Uint8Array(length));

    return values.reduce(
        (result, value) =>
            result + possible[value % possible.length],
        ''
    );
};
/*
* Hash the verifier using SHA-256.
*/
const sha256 = async (plainText) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);

    return window.crypto.subtle.digest('SHA-256', data);
};
/*
* Convert the hash into Spotify's required Base64 URL format.
*/
const base64Encode = (input) => {
    return btoa(
        String.fromCharCode(...new Uint8Array(input))
    )
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
};
const Spotify = {
    /*
    * Step 1:
    * Generate the PKCE verifier and challenge,
    * and then redirect the user to Spotify.
    */
    async redirectToSpotifyAuthorization() {
        const codeVerifier = generateRandomString(64);
        const hashedVerifier = await sha256(codeVerifier);
        const codeChallenge = base64Encode(hashedVerifier);

        sessionStorage.setItem('code_verifier', codeVerifier);
        const authUrl = new URL(authorizeEndpoint);

        const params = {
            response_type: 'code',
            client_id: clientId,
            scope: scopes.join(' '),
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            redirect_uri: redirectUri
        };

        authUrl.search = new URLSearchParams(params).toString();

        window.location.href = authUrl.toString();
    },

    /*
    * Step 2:
    * Exchange Spotify's authorization code for an access token.
    */
    async exchangeCodeForToken(code) {
        const codeVerifier = sessionStorage.getItem('code_verifier');

        if (!codeVerifier) {
            throw new Error('PKCE code verifier was not found.');
        }

        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: clientId,
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier
            })
        });

        if (!response.ok) {
            const errorDetails = await response.text();

            throw new Error(
                `Token request failed: ${response.status} ${errorDetails}`
            );
        }

        const data = await response.json();

        accessToken = data.access_token;

        localStorage.setItem('access_token', data.access_token);

        if (data.refresh_token) {
            localStorage.setItem(
                'refresh_token',
                data.refresh_token
            );
        }

        const expiresAt = Date.now() + data.expires_in * 1000;

        localStorage.setItem(
            'access_token_expires_at',
            expiresAt.toString()
        );

        localStorage.removeItem('code_verifier');

        // Remove "?code=..." from the browser address bar.
        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

        return accessToken;
    },

    /*
    * Step 3:
    * Reuse an existing token, exchange the callback code,
    * or start authorization.
    */
    async getAccessToken() {
        if (accessToken) {
            return accessToken;
        }

        const storedToken = localStorage.getItem('access_token');
        const expiresAt = Number(
            localStorage.getItem('access_token_expires_at')
        );

        if (
            storedToken &&
            expiresAt &&
            Date.now() < expiresAt
        ) {
            accessToken = storedToken;
            return accessToken;
        }

        const urlParams = new URLSearchParams(
            window.location.search
        );

        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
            throw new Error(
                `Spotify authorization failed: ${error}`
            );
        }

        if (code) {
            return Spotify.exchangeCodeForToken(code);
        }

        await Spotify.redirectToSpotifyAuthorization();

        // Navigation has started, so no token is returned yet.
        return null;
    },

    /*
    * Search Spotify for tracks.
    */
    async search(term) {
        try {
            const token = await Spotify.getAccessToken();

            // The first call may redirect to Spotify.
            if (!token) {
                return [];
            }

            const searchUrl = new URL(
                'https://api.spotify.com/v1/search'
            );

            searchUrl.search = new URLSearchParams({
                type: 'track',
                q: term
            }).toString();

            const response = await fetch(searchUrl.toString(), {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorDetails = await response.text();

                throw new Error(
                    `Search failed: ${response.status} ${errorDetails}`
                );
            }

            const data = await response.json();

            if (!data.tracks) {
                return [];
            }

            return data.tracks.items.map((track) => ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                uri: track.uri
            }));
        } catch (error) {
            console.error('Spotify search error:', error);
            return [];
        }
    },

    async getCurrentUserId() {
        if (userId) {
            return userId;
        } else 
            {
            const accessToken = await Spotify.getAccessToken();

            const getRequest = await fetch('https:api.spotify.com/v1/me', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (!getRequest.ok) {
                const errorDetails = await getRequest.text();

                throw new Error(
                    `Response failed: ${getRequest.status} ${errorDetails}`
                );
            }
            const data = await getRequest.json();

            if (!data) return;

            userId = data.id;
            return userId;
        }
    },

    async savePlayList(playlistName, trackUris, playlistId) {
        console.log(playlistName, " and ", trackUris);
        if (playlistName && trackUris.length > 0) {

            if (playlistId != null) {
                await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    "uris": trackUris,
                    "position": 0
                })
            });
            console.log("made a request to modify playlist");
            } else {
                const accessToken = await Spotify.getAccessToken();
    
                const postRequest = await fetch("https://api.spotify.com/v1/me/playlists", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        name: playlistName,
                        public: false
                    })
                });
    
                if (!postRequest.ok) {
                    const errorDetails = await postRequest.text();
    
                    throw new Error(
                        `Response from POST failed: ${postRequest.status} ${errorDetails}`
                    );
                }
    
                const postRequestdata = await postRequest.json();
                if (!postRequestdata) return;
                const newPlaylistID = postRequestdata.id;
    
                await fetch(`https://api.spotify.com/v1/playlists/${newPlaylistID}/items`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        "uris": trackUris,
                        "position": 0
                    })
                });
                console.log("made a request to add new playlist");
            }

        } else {
            console.log("playlist not saved");
            return;
        }
    },

    async getUserPlaylists() {
        const accessToken = await Spotify.getAccessToken();

        const getPlaylistsRequest = await fetch("https://api.spotify.com/v1/me/playlists?limit=5&offset=5", {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (!getPlaylistsRequest.ok) {
            const errorDetails = await getPlaylistsRequest.text();

            throw new Error(
                `Response from POST failed: ${getPlaylistsRequest.status} ${errorDetails}`
            );
        }

        const data = await getPlaylistsRequest.json();

        if (!data) return [];
    //    console.log('playlist data:',data);
        return data.items.map((playlist) => ({
            id: playlist.id,
            name: playlist.name,
            playlistOwnerId: playlist.owner.id,
        }));
    },

    async getPlaylist(id) {
        const accessToken = await Spotify.getAccessToken();

        const getPlaylistsTracks = await fetch(`https://api.spotify.com/v1/playlists/${id}/items?limit=5&offset=0`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (!getPlaylistsTracks.ok) {
            const errorDetails = await getPlaylistsTracks.text();

            throw new Error(
                `Response from POST failed: ${getPlaylistsTracks.status} ${errorDetails}`
            );
        }

        const data = await getPlaylistsTracks.json();

        if (!data) return;
        return data.items.map((track) => ({
                id: track.item.id,
                name: track.item.name,
                artist: track.item.artists[0].name,
                album: track.item.album.name,
                uri: track.item.uri
            }));

    }
};

export default Spotify;