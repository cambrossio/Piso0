const Config = require('../models/Config');

exports.get = async (req, res) => {
  try {
    const configs = await Config.findAll();
    const configMap = {};
    configs.forEach(c => {
      try {
        configMap[c.key] = JSON.parse(c.value);
      } catch {
        configMap[c.key] = c.value;
      }
    });
    res.json(configMap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.set = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Key es requerido' });
    }
    await Config.upsert({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value)
    });
    res.json({ message: 'Configuración guardada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.checkDeliveryAvailable = async (req, res) => {
  try {
    const config = await Config.findByPk('deliverySchedule');
    let schedule = {
      enabled: true,
      days: [0, 1, 2, 3, 4, 5, 6],
      startHour: 20,
      startMinute: 0,
      endHour: 23,
      endMinute: 59
    };

    if (config && config.value) {
      try {
        schedule = { ...schedule, ...JSON.parse(config.value) };
      } catch (e) {}
    }

    const now = new Date();
    const options = { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false };
    const timeString = now.toLocaleTimeString('es-AR', options);
    const [currentHour, currentMinute] = timeString.split(':').map(Number);
    const currentTime = currentHour * 60 + currentMinute;
    const startTime = schedule.startHour * 60 + schedule.startMinute;
    const endTime = schedule.endHour * 60 + schedule.endMinute;

    const dayOptions = { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'long' };
    const dayName = now.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short' });
    const dayMap = { 'dom': 0, 'lun': 1, 'mar': 2, 'mié': 3, 'jue': 4, 'vie': 5, 'sáb': 6 };
    const dayOfWeek = dayMap[dayName] ?? now.getDay();

    const dayAvailable = schedule.days.includes(dayOfWeek);
    const timeAvailable = currentTime >= startTime && currentTime <= endTime;
    const isAvailable = schedule.enabled && dayAvailable && timeAvailable;

    res.json({
      available: isAvailable,
      reason: !schedule.enabled ? 'Delivery deshabilitado' :
              !dayAvailable ? 'No disponible hoy' :
              !timeAvailable ? 'Fuera de horario' : null,
      schedule: schedule,
      currentTime: timeString,
      timezone: 'America/Argentina/Buenos_Aires'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
