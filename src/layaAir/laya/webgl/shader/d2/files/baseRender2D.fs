#define SHADER_NAME BaseRender2DPS
#if defined(GL_FRAGMENT_PRECISION_HIGH) // 原来的写法会被我们自己的解析流程处理，而我们的解析是不认内置宏的，导致被删掉，所以改成 if defined 了
precision highp float;
#else
precision mediump float;
#endif

#include "Sprite2DFrag.glsl";

varying vec2 v_lightUV[5];//TODO

void main()
{
    clip();
    vec4 textureColor = texture2D(u_baseRender2DTexture, v_texcoord);
    #ifdef LIGHT_AND_SHADOW//TODO
    vec3 ls = vec3(0.0);
    for(int i=0; i<5; i++) {
        ls += texture2D(u_LightAndShadow2D, v_lightUV[i]).rgb;
    }
    ls = ls / 5.0 + u_LightAndShadow2DAmbient.rgb;
    textureColor.rgb = textureColor.rgb * ls;
    #endif
    textureColor = transspaceColor(textureColor);
    setglColor(textureColor);
}