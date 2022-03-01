/** Connect to Moralis server */
const serverUrl = "https://gam2bmewyuoz.usemoralis.com:2053/server";
const appId = "PSPIX486pxXFpMJ5LyX7s4z8TlAlLqCFBWqEOnQe";
Moralis.start({ serverUrl, appId });
let user;

/** Add from here down */
async function login() {
    user = Moralis.User.current();
    if (!user) {
        try {
            user = await Moralis.authenticate({ signingMessage: "Hello World!" })
            console.log(user)
            console.log(user.get('ethAddress'))
            initApp();
        } catch (error) {
            console.log(error)
        }
    }
}

function initApp() {
    
    document.querySelector('#app').style.display = 'block';
    document.querySelector('#btn_submit').addEventListener('click', submit);

}

function toggleLoading(state) {
    if(state) {        
        document.querySelector('#loading').style.display = 'block';
    }
    else {
        document.querySelector('#loading').style.display = 'none';
    }

}

async function submit() {
    toggleLoading(true);
    // get image data
    let imageData = document.querySelector('#ip_image');
    let image = imageData.files[0];
    const imageFile  = new Moralis.File(image.name, image);

    // upload image to IPFS
    await imageFile.saveIPFS();
    let imageHash = imageFile.hash();
    
    // create metadata with image hash and data
    let metadata = {
        name: document.querySelector('#ip_name').value,
        description: document.querySelector('#ip_description').value,
        image: `/ipfs/${imageHash}`
    }

    // upload metadata to IPFS
    let metadataFile = new Moralis.File('metadata.json', {base64: btoa(JSON.stringify(metadata))});
    await metadataFile.saveIPFS();
    let metadataHash = metadataFile.hash();

    // upload to Rarible using plugin
    const res = await Moralis.Plugins.rarible.lazyMint({
        chain: 'rinkeby',
        userAddress: user.get('ethAddress'),
        tokenType: 'ERC1155',
        tokenUri: `/ipfs/${metadataHash}`,
        royaltiesAmount: 5,
    });
    const token_address = res.data.result.tokenAddress;
    const token_id = res.data.result.tokenId;
    let url = `https://rinkeby.rarible.com/token/${token_address}:${token_id}`;
    console.log('done')
    document.querySelector('#result').innerHTML = `<a href="${url}" target="_blank">View NFT</a>`;
    document.querySelector('#success-message').style.display = 'block';
    toggleLoading(false);
}

login();