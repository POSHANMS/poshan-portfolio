module.paths.push('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/node_modules');

const { NodeIO } = require('@gltf-transform/core');
const { KHRDracoMeshCompression } = require('@gltf-transform/extensions');
const draco3d = require('draco3d');
const path = require('path');
const fs = require('fs');

const inputGlbPath = path.resolve('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/public/models/laptop.glb');
const outputGlbPath = path.resolve('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/public/models/laptop-baked.glb');
const texturePath = path.resolve('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/public/textures/vscode-screen.png');

console.log('Input GLB:', inputGlbPath);
console.log('Output GLB:', outputGlbPath);
console.log('Texture PNG:', texturePath);

async function main() {
  if (!fs.existsSync(texturePath)) {
    throw new Error(`Texture not found at: ${texturePath}`);
  }

  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });
  
  const document = await io.read(inputGlbPath);
  const root = document.getRoot();

  // Find Material.004
  const materials = root.listMaterials();
  const screenMaterial = materials.find(m => m.getName() === 'Material.004');
  
  if (!screenMaterial) {
    throw new Error('Screen material "Material.004" not found in the GLB!');
  }
  
  console.log(`Found material: "${screenMaterial.getName()}"`);

  // Load the new PNG texture
  const textureData = fs.readFileSync(texturePath);
  const screenTexture = document.createTexture('vscode-screen')
    .setImage(textureData)
    .setMimeType('image/png');

  // Assign baseColorTexture
  screenMaterial.setBaseColorTexture(screenTexture);
  console.log('Assigned vscode-screen.png to baseColorTexture');

  // Assign emissiveTexture with glow factor 0.38
  screenMaterial.setEmissiveTexture(screenTexture);
  screenMaterial.setEmissiveFactor([0.38, 0.38, 0.38]);
  console.log('Assigned vscode-screen.png to emissiveTexture with factor 0.38');

  // Write out the modified GLB
  console.log('Writing output GLB...');
  await io.write(outputGlbPath, document);
  console.log('Success! Baked laptop saved to:', outputGlbPath);
}

main().catch(console.error);
