package com.frontend

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactRootView            // ← 새로 추가
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView   // 이미 추가됨

class MainActivity : ReactActivity() {

  /** JS에서 등록한 메인 컴포넌트 이름 */
  override fun getMainComponentName(): String = "frontend"

  /** ReactActivityDelegate 커스터마이징 → RootView를 제스처 핸들러용으로 교체 */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return object : DefaultReactActivityDelegate(
      this,
      mainComponentName,
      fabricEnabled      // 그대로 둡니다
    ) {
      override fun createRootView(): ReactRootView {
        // 👇 핵심: 제스처 핸들러가 활성화된 RootView 반환
        return RNGestureHandlerEnabledRootView(this@MainActivity)
      }
    }
  }
}
