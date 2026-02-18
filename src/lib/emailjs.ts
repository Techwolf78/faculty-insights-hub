// EmailJS Configuration – choose by hostname or environment variables
const envService = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const envTemplate = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const envPublic = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;

// Development (local) defaults
const devConfig = {
  SERVICE_ID: 'service_s9nh482',
  TEMPLATE_ID: 'template_qy89apm',
  PUBLIC_KEY: 'UeCAvDPTKfBP6JcG4',
};

// Production keys (faculty.gryphonacademy.co.in)
const prodConfig = {
  SERVICE_ID: 'service_ja13aqr',
  TEMPLATE_ID: 'template_9l3rsje',
  PUBLIC_KEY: 'hsFZ4HCxpnKgFfL7i',
};

let EMAILJS_CONFIG = {
  SERVICE_ID: envService || devConfig.SERVICE_ID,
  TEMPLATE_ID: envTemplate || devConfig.TEMPLATE_ID,
  PUBLIC_KEY: envPublic || devConfig.PUBLIC_KEY,
};

if (typeof window !== 'undefined' && window.location.hostname === 'faculty.gryphonacademy.co.in') {
  EMAILJS_CONFIG = {
    SERVICE_ID: envService || prodConfig.SERVICE_ID,
    TEMPLATE_ID: envTemplate || prodConfig.TEMPLATE_ID,
    PUBLIC_KEY: envPublic || prodConfig.PUBLIC_KEY,
  };
}

export { EMAILJS_CONFIG };