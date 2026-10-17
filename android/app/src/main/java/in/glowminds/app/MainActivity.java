package in.glowminds.app;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.DecelerateInterpolator;
import android.view.animation.OvershootInterpolator;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/**
 * Glowminds shell with a branded animated splash overlay.
 * System SplashScreen (dark) avoids white flash; property animators
 * fade/scale the logo and wordmark, then cross-fade into the WebView.
 */
public class MainActivity extends BridgeActivity {

    private static final int SPLASH_BG = 0xFF07090F;
    private static final long MIN_SPLASH_MS = 2000L;
    private static final long MAX_SPLASH_MS = 3500L;
    private static final long FADE_OUT_MS = 420L;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private View splashRoot;
    private ImageView splashLogo;
    private ImageView splashGlow;
    private TextView splashWordmark;
    private TextView splashTagline;

    private boolean keepSystemSplash = true;
    private boolean entranceDone = false;
    private boolean webStarted = false;
    private boolean splashDismissed = false;
    private long splashShownAt = 0L;

    private final Runnable progressPoll = new Runnable() {
        @Override
        public void run() {
            if (splashDismissed) {
                return;
            }
            try {
                if (getBridge() != null) {
                    WebView webView = getBridge().getWebView();
                    if (webView != null && webView.getProgress() > 15) {
                        webStarted = true;
                        maybeDismissSplash();
                    }
                }
            } catch (Exception ignored) {
                // Bridge may not be ready yet
            }
            if (!splashDismissed) {
                mainHandler.postDelayed(this, 120);
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen systemSplash = SplashScreen.installSplashScreen(this);
        systemSplash.setKeepOnScreenCondition(() -> keepSystemSplash);

        // Dark window chrome before content draws — prevents white flash
        getWindow().setStatusBarColor(SPLASH_BG);
        getWindow().setNavigationBarColor(SPLASH_BG);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
        }

        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        WindowInsetsControllerCompat insets =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (insets != null) {
            insets.setAppearanceLightStatusBars(false);
            insets.setAppearanceLightNavigationBars(false);
        }

        splashShownAt = System.currentTimeMillis();
        attachAnimatedSplash();

        // Release system splash once our overlay is attached
        keepSystemSplash = false;

        mainHandler.postDelayed(progressPoll, 200);
        mainHandler.postDelayed(() -> {
            webStarted = true; // safety: don't block forever if load is slow
            maybeDismissSplash();
        }, MAX_SPLASH_MS);
    }

    private void attachAnimatedSplash() {
        ViewGroup content = findViewById(android.R.id.content);
        if (content == null) {
            entranceDone = true;
            return;
        }

        splashRoot = getLayoutInflater().inflate(R.layout.splash_overlay, content, false);
        FrameLayout.LayoutParams lp =
            new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            );
        content.addView(splashRoot, lp);

        splashLogo = splashRoot.findViewById(R.id.splash_logo);
        splashGlow = splashRoot.findViewById(R.id.splash_glow);
        splashWordmark = splashRoot.findViewById(R.id.splash_wordmark);
        splashTagline = splashRoot.findViewById(R.id.splash_tagline);

        // Start state
        splashLogo.setAlpha(0f);
        splashLogo.setScaleX(0.82f);
        splashLogo.setScaleY(0.82f);
        splashGlow.setAlpha(0f);
        splashGlow.setScaleX(0.7f);
        splashGlow.setScaleY(0.7f);
        splashWordmark.setAlpha(0f);
        splashWordmark.setTranslationY(18f);
        splashTagline.setAlpha(0f);
        splashTagline.setTranslationY(12f);

        runEntranceAnimation();
    }

    private void runEntranceAnimation() {
        // Logo: fade + scale with slight overshoot
        ObjectAnimator logoAlpha = ObjectAnimator.ofFloat(splashLogo, View.ALPHA, 0f, 1f);
        ObjectAnimator logoScaleX = ObjectAnimator.ofFloat(splashLogo, View.SCALE_X, 0.82f, 1f);
        ObjectAnimator logoScaleY = ObjectAnimator.ofFloat(splashLogo, View.SCALE_Y, 0.82f, 1f);
        AnimatorSet logoIn = new AnimatorSet();
        logoIn.playTogether(logoAlpha, logoScaleX, logoScaleY);
        logoIn.setDuration(720);
        logoIn.setInterpolator(new OvershootInterpolator(0.9f));

        // Soft glow behind mark
        ObjectAnimator glowAlpha = ObjectAnimator.ofFloat(splashGlow, View.ALPHA, 0f, 0.55f);
        ObjectAnimator glowScaleX = ObjectAnimator.ofFloat(splashGlow, View.SCALE_X, 0.7f, 1f);
        ObjectAnimator glowScaleY = ObjectAnimator.ofFloat(splashGlow, View.SCALE_Y, 0.7f, 1f);
        AnimatorSet glowIn = new AnimatorSet();
        glowIn.playTogether(glowAlpha, glowScaleX, glowScaleY);
        glowIn.setDuration(900);
        glowIn.setInterpolator(new DecelerateInterpolator());

        // Wordmark
        ObjectAnimator wordAlpha = ObjectAnimator.ofFloat(splashWordmark, View.ALPHA, 0f, 1f);
        ObjectAnimator wordY = ObjectAnimator.ofFloat(splashWordmark, View.TRANSLATION_Y, 18f, 0f);
        AnimatorSet wordIn = new AnimatorSet();
        wordIn.playTogether(wordAlpha, wordY);
        wordIn.setDuration(480);
        wordIn.setStartDelay(280);
        wordIn.setInterpolator(new DecelerateInterpolator());

        // Tagline
        ObjectAnimator tagAlpha = ObjectAnimator.ofFloat(splashTagline, View.ALPHA, 0f, 1f);
        ObjectAnimator tagY = ObjectAnimator.ofFloat(splashTagline, View.TRANSLATION_Y, 12f, 0f);
        AnimatorSet tagIn = new AnimatorSet();
        tagIn.playTogether(tagAlpha, tagY);
        tagIn.setDuration(420);
        tagIn.setStartDelay(420);
        tagIn.setInterpolator(new DecelerateInterpolator());

        AnimatorSet entrance = new AnimatorSet();
        entrance.playTogether(logoIn, glowIn, wordIn, tagIn);
        entrance.addListener(
            new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    runPulseThenReady();
                }
            }
        );
        entrance.start();
    }

    private void runPulseThenReady() {
        // Gentle pulse on logo + glow
        ObjectAnimator pulseUpX = ObjectAnimator.ofFloat(splashLogo, View.SCALE_X, 1f, 1.045f);
        ObjectAnimator pulseUpY = ObjectAnimator.ofFloat(splashLogo, View.SCALE_Y, 1f, 1.045f);
        ObjectAnimator pulseDownX = ObjectAnimator.ofFloat(splashLogo, View.SCALE_X, 1.045f, 1f);
        ObjectAnimator pulseDownY = ObjectAnimator.ofFloat(splashLogo, View.SCALE_Y, 1.045f, 1f);
        ObjectAnimator glowPulse = ObjectAnimator.ofFloat(splashGlow, View.ALPHA, 0.55f, 0.85f, 0.45f);

        AnimatorSet pulseUp = new AnimatorSet();
        pulseUp.playTogether(pulseUpX, pulseUpY);
        pulseUp.setDuration(420);
        pulseUp.setInterpolator(new AccelerateDecelerateInterpolator());

        AnimatorSet pulseDown = new AnimatorSet();
        pulseDown.playTogether(pulseDownX, pulseDownY);
        pulseDown.setDuration(420);
        pulseDown.setInterpolator(new AccelerateDecelerateInterpolator());

        glowPulse.setDuration(840);
        glowPulse.setInterpolator(new AccelerateDecelerateInterpolator());

        AnimatorSet pulse = new AnimatorSet();
        pulse.play(pulseUp).before(pulseDown);
        pulse.play(glowPulse).with(pulseUp);
        pulse.addListener(
            new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    entranceDone = true;
                    maybeDismissSplash();
                }
            }
        );
        pulse.start();
    }

    private void maybeDismissSplash() {
        if (splashDismissed || splashRoot == null) {
            return;
        }
        long elapsed = System.currentTimeMillis() - splashShownAt;
        if (!entranceDone) {
            return;
        }
        if (!webStarted && elapsed < MAX_SPLASH_MS) {
            return;
        }
        if (elapsed < MIN_SPLASH_MS) {
            mainHandler.postDelayed(this::maybeDismissSplash, MIN_SPLASH_MS - elapsed);
            return;
        }
        dismissSplash();
    }

    private void dismissSplash() {
        if (splashDismissed || splashRoot == null) {
            return;
        }
        splashDismissed = true;
        mainHandler.removeCallbacks(progressPoll);

        splashRoot
            .animate()
            .alpha(0f)
            .setDuration(FADE_OUT_MS)
            .setInterpolator(new DecelerateInterpolator())
            .withEndAction(
                () -> {
                    ViewGroup parent = (ViewGroup) splashRoot.getParent();
                    if (parent != null) {
                        parent.removeView(splashRoot);
                    }
                    splashRoot = null;
                }
            )
            .start();
    }

    @Override
    public void onDestroy() {
        mainHandler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }
}
