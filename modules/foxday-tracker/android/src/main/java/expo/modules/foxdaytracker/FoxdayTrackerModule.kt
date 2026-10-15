package expo.modules.foxdaytracker

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Foxday üçün yerli modul:
 *  - Ekran vaxtı (UsageStatsManager): hansı app-də nə qədər vaxt, telefonu neçə dəfə açmaq
 *  - Addım sayğacı (TYPE_STEP_COUNTER sensoru): telefon yandırılandan bəri addımlar
 *
 * Expo Go-da bu modul yoxdur — JS tərəfi requireOptionalNativeModule ilə yoxlayır.
 */
class FoxdayTrackerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context yoxdur")

  override fun definition() = ModuleDefinition {
    Name("FoxdayTracker")

    // ---------- Ekran vaxtı ----------

    /** "Usage Access" icazəsi verilibmi? */
    Function("hasUsageAccess") {
      return@Function hasUsageAccess()
    }

    /** Telefonun "İstifadə məlumatlarına giriş" ayarlarını açır. */
    Function("openUsageAccessSettings") {
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    /**
     * Verilən zaman aralığında hər app-in ön planda olduğu vaxt (ms) və telefonun açılma sayı.
     * Qaytarır: { apps: [{ packageName, label, ms }], unlocks }
     */
    Function("getUsage") { startMs: Double, endMs: Double ->
      return@Function getUsage(startMs.toLong(), endMs.toLong())
    }

    // ---------- Addımlar ----------

    Function("hasStepSensor") {
      val sm = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
      return@Function sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null
    }

    /**
     * Telefon yandırılandan bəri ümumi addım sayı (sensor dəyəri).
     * Sensor yoxdursa və ya 4 saniyəyə cavab vermirsə, -1.
     */
    AsyncFunction("getStepCounter") { promise: Promise ->
      val sm = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
      val sensor = sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
      if (sensor == null) {
        promise.resolve(-1.0)
        return@AsyncFunction
      }
      val handler = Handler(Looper.getMainLooper())
      var done = false
      lateinit var listener: SensorEventListener
      val timeout = Runnable {
        if (!done) {
          done = true
          sm.unregisterListener(listener)
          promise.resolve(-1.0)
        }
      }
      listener = object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent) {
          if (done) return
          done = true
          handler.removeCallbacks(timeout)
          sm.unregisterListener(this)
          promise.resolve(event.values[0].toDouble())
        }

        override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
      }
      handler.post {
        sm.registerListener(listener, sensor, SensorManager.SENSOR_DELAY_NORMAL)
      }
      handler.postDelayed(timeout, 4000)
    }
  }

  private fun hasUsageAccess(): Boolean {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  /** Ana ekran (launcher) app-ı — onu siyahıya daxil etmirik. */
  private fun launcherPackage(): String? {
    val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
    return context.packageManager.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)?.activityInfo?.packageName
  }

  private fun labelOf(pm: PackageManager, pkg: String): String {
    return try {
      pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
    } catch (e: Exception) {
      pkg
    }
  }

  private fun getUsage(startMs: Long, endMs: Long): Map<String, Any> {
    if (!hasUsageAccess()) {
      return mapOf("apps" to emptyList<Map<String, Any>>(), "unlocks" to 0)
    }
    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val now = System.currentTimeMillis()
    val end = minOf(endMs, now)
    val events = usm.queryEvents(startMs, end)
    val totals = HashMap<String, Long>()
    var unlocks = 0

    // Hansı app hazırda ön plandadır (bir anda yalnız biri)
    var fgPackage: String? = null
    var fgStart = 0L
    val seen = HashSet<String>()

    fun close(at: Long) {
      val pkg = fgPackage ?: return
      if (at > fgStart) totals[pkg] = (totals[pkg] ?: 0L) + (at - fgStart)
      fgPackage = null
    }

    val event = UsageEvents.Event()
    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      val pkg = event.packageName ?: continue
      val ts = event.timeStamp
      when (event.eventType) {
        UsageEvents.Event.ACTIVITY_RESUMED -> {
          if (fgPackage != pkg) {
            close(ts)
            fgPackage = pkg
            fgStart = ts
          }
          seen.add(pkg)
        }
        UsageEvents.Event.ACTIVITY_PAUSED -> {
          if (fgPackage == pkg) {
            close(ts)
          } else if (fgPackage == null && !seen.contains(pkg)) {
            // Aralıq başlayanda app artıq açıq idi
            totals[pkg] = (totals[pkg] ?: 0L) + (ts - startMs)
          }
          seen.add(pkg)
        }
        UsageEvents.Event.SCREEN_NON_INTERACTIVE -> close(ts)
        UsageEvents.Event.KEYGUARD_HIDDEN -> unlocks++
      }
    }
    close(end)

    val pm = context.packageManager
    val skip = setOfNotNull(launcherPackage(), "com.android.systemui")
    val apps = totals
      .filter { (pkg, ms) -> ms >= 30_000 && pkg !in skip }
      .entries
      .sortedByDescending { it.value }
      .map { (pkg, ms) -> mapOf("packageName" to pkg, "label" to labelOf(pm, pkg), "ms" to ms.toDouble()) }

    return mapOf("apps" to apps, "unlocks" to unlocks)
  }
}
