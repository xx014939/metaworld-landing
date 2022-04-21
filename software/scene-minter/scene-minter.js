/** Connect to Moralis server */
const serverUrl = "https://v9oc9hiaeyfd.usemoralis.com:2053/server";
const appId = "5oM1IKJp6DztgB8iWnmttGpebc1LWCxD8XFYdqU7";
Moralis.start({ serverUrl, appId });
let user = Moralis.User.current();

/** Add from here down */
async function login() {
    console.log('starting')
  if (!user) {
    console.log('starting1')
   try {
      user = await Moralis.authenticate({ signingMessage: "Hello World!" })
      initApp();
   } catch(error) {
     console.log(error)
   }
  }
  else{
    console.log('starting2', user.get('ethAddress'))
    Moralis.enableWeb3();
    initApp();
  }
}

function initApp(){
    document.querySelector("#app").style.display = "block";
    document.querySelector("#submit_button").onclick = submit;
}


async function submit(){

    if (document.querySelector('#input_name').value != "") {
        document.querySelector('.patient').style.display = "block"
    } else {
        alert("Please fill out all form fields")
    }

    let metadata = {
        name: document.querySelector('#input_name').value,
        description: document.querySelector('#input_description').value,
        sceneURL: document.querySelector('#pinata_url').value,
        videoURL: document.querySelector('#video_url').value
    }
    console.log(metadata);
    const jsonFile = new Moralis.File("metadata.json", {base64 : btoa(JSON.stringify(metadata))});
    await jsonFile.saveIPFS();

    let metadataHash = jsonFile.hash();
    console.log(jsonFile.ipfs())
    let res = await Moralis.Plugins.rarible.lazyMint({
        chain: 'eth',
        userAddress: user.get('ethAddress'),
        tokenType: 'ERC721',
        tokenUri: 'ipfs://' + metadataHash,
        royaltiesAmount: 5, // 0.05% royalty. Optional
    })


    // Construct GLTF URL & obtain user ID
    sceneURL = document.querySelector('#pinata_url').value
    const userID = document.getElementById('user_id').value

    // Retrieve existing URL's inside of the users 3d nft array
    const response = await fetch(`https://tranquil-bayou-15552.herokuapp.com/subscribers/${userID}`)
    const payload = await response.json()
    let existingSceneURLs = payload.unity_scene_url
    existingSceneURLs.push(sceneURL) // Append new URL to array
    console.log('This is the new array -->', existingSceneURLs)

    // Patch user using ID and newly updated array
    var xhr = new XMLHttpRequest();
    xhr.open("PATCH", `https://tranquil-bayou-15552.herokuapp.com/subscribers/${userID}`);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");

    const userAddress = user.get('ethAddress')

    xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
        console.log(xhr.status);
        console.log(xhr.responseText);
    }};

    var existingUser = `{
        "unity_scene_url": "${String(existingSceneURLs)}"
    }`;

    xhr.send(existingUser);

    //console.log(res);
    document.querySelector('#success_message').innerHTML = 
        `NFT minted. <a href="https://rarible.com/token/${res.data.result.tokenAddress}:${res.data.result.tokenId}">View NFT`;
    document.querySelector('#success_message').style.display = "block";

    document.querySelector('.patient').style.display = "none"
    document.querySelector('.success').style.display = "block"
}


login();
