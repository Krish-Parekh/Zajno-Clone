import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import Lenis from 'lenis'
import * as THREE from 'three';
import vertexShader from "../shaders/vertex.glsl";
import fragmentShader from "../shaders/fragment.glsl";

const lenis = new Lenis({
    autoRaf: true,
});

lenis.on('scroll', ScrollTrigger.update);

gsap.registerPlugin(ScrollTrigger);

gsap.from(".studio-border", {
    height: "0px",
    scrollTrigger: {
        trigger: ".studio-services",
        start: "top 80%",
        end: "bottom 20%",
        scrub: true,
    },
})

gsap.from(".playground-border", {
    height: "0px",
    scrollTrigger: {
        trigger: "#playground-section",
        start: "top 80%",
        end: "bottom 20%",
        scrub: true,
    },
});

gsap.from(".footer-border", {
    height: "0px",
    scrollTrigger: {
        trigger: "#footer-section",
        start: "top 90%",
        end: "center 90%",
        scrub: true,
    },
});


const scene = new THREE.Scene();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const distance = 25;

// Calculate the field of view (FOV) in degrees based on the camera distance and window height
// This ensures the camera's view perfectly matches the screen dimensions at the given distance
const fov = Math.atan((window.innerHeight / 2) / distance) * 2 * (180 / Math.PI);

// Create a perspective camera with the calculated FOV, aspect ratio, and near/far clipping planes
const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

camera.position.z = distance;

const images = document.querySelectorAll('img');
const planes = [];
images.forEach(image => {
    const imageProperties = image.getBoundingClientRect();
    const texture = new THREE.TextureLoader().load(image.src);
    texture.colorSpace = THREE.SRGBColorSpace;
    const geometry = new THREE.PlaneGeometry(imageProperties.width, imageProperties.height);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: {
                value: texture
            },
            uMouse: {
                value: new THREE.Vector2(0.5, 0.5)
            },
            uHover: {
                value: 0
            }
        },
        vertexShader,
        fragmentShader
    });
    const plane = new THREE.Mesh(geometry, material);
    // Position the 3D plane to match the corresponding HTML image element's position on screen
    // Convert from screen coordinates (top-left origin) to Three.js world coordinates (center origin)
    // X: Move from left edge to center, then offset by half the image width to center the plane
    // Y: Flip Y axis (screen Y increases downward, Three.js Y increases upward) and center
    // Z: Keep at 0 depth (same plane as other elements)
    plane.position.set(
        imageProperties.left - window.innerWidth / 2 + imageProperties.width / 2,  // Center X position
        -imageProperties.top + window.innerHeight / 2 - imageProperties.height / 2, // Center Y position (flipped)
        0 // Z depth
    );
    scene.add(plane);
    planes.push(plane);
});


// This function updates the position of each 3D plane to match its corresponding HTML image element
// It's called every frame to keep the 3D planes synchronized with the DOM images during scroll/resize
function setImagePosition() {
    planes.forEach((plane, index) => {
        // Get the current screen position and dimensions of the HTML image element
        const imagePropertis = images[index].getBoundingClientRect();
        
        // Convert from screen coordinates to Three.js world coordinates:
        // - Screen origin (0,0) is top-left, Three.js origin is center
        // - X: Subtract half window width to center, then add half image width to center the plane
        // - Y: Flip Y axis (screen Y goes down, Three.js Y goes up) and center vertically
        // - Z: Keep at 0 depth
        plane.position.set(
            imagePropertis.left - window.innerWidth / 2 + imagePropertis.width / 2, 
            -imagePropertis.top + window.innerHeight / 2 - imagePropertis.height / 2, 
            0
        );
    });
}

function animate() {
    requestAnimationFrame(animate);
    setImagePosition();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

let inactivityTimer;

function onPointerMove(event) {


    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

    inactivityTimer = setTimeout(() => {
        planes.forEach(plane => {
            gsap.to(plane.material.uniforms.uHover, {
                value: 0,
                duration: 1
            })
        })
    }, 10);


    render();
}


function render() {
    // Cast a ray from the camera through the mouse position to detect intersections
    raycaster.setFromCamera(pointer, camera);

    // Check if the ray intersects with any of the image planes
    const intersects = raycaster.intersectObjects(planes);

    // If we hit at least one plane
    if (intersects.length > 0) {
        // Get the UV coordinates where the ray hit the plane (0-1 range)
        const uv = intersects[0].uv
        
        // Animate the hover effect uniform to 1 (fully active)
        gsap.to(intersects[0].object.material.uniforms.uHover, {
            value: 1,
            duration: 1
        })
        
        // Animate the mouse position uniform to the UV coordinates where we hit
        // This tells the shader where the distortion effect should be centered
        gsap.to(intersects[0].object.material.uniforms.uMouse.value, {
            x: uv.x,
            y: uv.y,
            duration: 1
        })

    }
    // Render the scene with the updated uniforms
    renderer.render(scene, camera);

}

window.addEventListener('pointermove', onPointerMove);
