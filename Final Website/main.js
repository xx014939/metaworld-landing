/** Connect to Moralis server */
const serverUrl = "https://v9oc9hiaeyfd.usemoralis.com:2053/server";
const appId = "5oM1IKJp6DztgB8iWnmttGpebc1LWCxD8XFYdqU7";
Moralis.start({ serverUrl, appId });
let user = Moralis.User.current();


// Let user select 3D NFT upload
/*
const optionButtons = document.querySelectorAll('.option-button')
let optionSelected = 0
optionButtons.forEach((button, i) => {
    button.addEventListener('click', () => {
        if (!button.classList.contains('option-button-selected')) {
            button.classList.add('option-button-selected')
            if (i == 1) {
                optionButtons[0].classList.remove('option-button-selected')
                optionSelected = 1
            } else {
                optionButtons[1].classList.remove('option-button-selected')
                optionSelected = 0
            }
        } else {
            button.classList.remove('option-button-selected')
        }
    })
})*/

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

async function retrieve3dNft() {
  console.log("Function is being called!")
  const response = await fetch("https://ethereum-api.rarible.org/v0.1/nft/items/byOwner?owner=0x868e35847A7F23832137f4eFB92436159a9AC6A1&size=10")
        let data = await response.json()
        console.log("Here is the NFT data: ",data)
        console.log("Here is the URL data: ",data.items[0].meta.image.url.ORIGINAL)

        const input = document.querySelector('#input_image');
        let fileData = input.files[0]
        
          console.log("Here is the URL data: ",`${data.items[0].meta.image.url.ORIGINAL}?filename=${fileData.name}`)
        

  const urlOutput = document.querySelector('.threed-url')
  urlOutput.innerHTML = `${data.items[0].meta.image.url.ORIGINAL}?filename=${fileData.name}`

} 

async function submit(){

    if (document.querySelector('#input_name').value != "") {
        document.querySelector('.patient').style.display = "block"
    } else {
        alert("Please fill out all form fields")
    }

    const input = document.querySelector('#input_image');
    let data = input.files[0]
    const imageFile = new Moralis.File(data.name, data)
    await imageFile.saveIPFS();
    let imageHash = imageFile.hash();
    let threedName = `3D NFT: ${document.querySelector('#input_name').value}`

    let metadata = {
        name: threedName,
        description: document.querySelector('#input_description').value,
        image: "/ipfs/" + imageHash
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
    gltfUrl = `https://ipfs.io/ipfs/${imageHash}?filename=${imageHash}.gltf`
    const userID = document.getElementById('user_id').value
    console.log("The gltf URL is here -->", gltfUrl)

    // Retrieve existing URL's inside of the users 3d nft array
    const response = await fetch(`https://tranquil-bayou-15552.herokuapp.com/subscribers/${userID}`)
    const payload = await response.json()
    let existing3DURLs = payload.threed_img_url
    existing3DURLs.push(gltfUrl) // Append new URL to array
    console.log('This is the new 3D array -->', existing3DURLs)

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
        "threed_img_url": "${String(existing3DURLs)}"
    }`;

    xhr.send(existingUser);

    //console.log(res);
    document.querySelector('#success_message').innerHTML = 
        `NFT minted. <a href="https://rarible.com/token/${res.data.result.tokenAddress}:${res.data.result.tokenId}">View NFT`;
    document.querySelector('#success_message').style.display = "block";

    document.querySelector('.patient').style.display = "none"
    document.querySelector('.success').style.display = "block"
   // retrieve3dNft()
}


login();
