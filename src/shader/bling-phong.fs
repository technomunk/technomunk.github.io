#version 300 es

#define MAX_LIGHTS 4

precision mediump float;

in vec3 vNormal;

// lights
uniform vec4 uLightPos[MAX_LIGHTS];  // if w is 0 - it's a directional light, if w is 1 - it's a point light
uniform vec3 uLightCol[MAX_LIGHTS];
uniform int uLightCount;
uniform vec3 uAmbient;

// camera
uniform vec3 uCameraPos;

// material properties
uniform vec3 uDiffuse;
uniform vec3 uSpecular;
uniform float uShininess;

out lowp vec4 oColor;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(uCameraPos - gl_FragCoord.xyz);

    vec3 color = vec3(0.0);
    for (int i = 0; i < uLightCount; i++) {
        vec3 lightDir;
        if (uLightPos[i].w == 0.0) {
            // directional light
            lightDir = normalize(-uLightPos[i].xyz);
        } else {
            // point light
            lightDir = normalize(uLightPos[i].xyz - gl_FragCoord.xyz);
        }
        vec3 lightColor = uLightCol[i];
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diff * lightColor * uDiffuse;
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
        vec3 specular = spec * lightColor * uSpecular;
        color += uAmbient + diffuse + specular;
    }

    oColor = vec4(color, 1.0);
}
