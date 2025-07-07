 # Learn more: https://firebase.google.com/docs/studio/customize-workspace
{ pkgs }: {
  # Specify the nixpkgs channel version.
  channel = "stable-24.11"; # Can be "unstable" if needed.

  # Define the development packages you want available in the environment.
  packages = [
    pkgs.nodejs_20   # Node.js 20.x LTS
    pkgs.zulu        # Zulu OpenJDK (for Firebase Emulator dependencies)
  ];

  # Set environment variables (optional customization point).
  env = {
    # Example:
    # NODE_ENV = "development";
  };

  # Firebase emulator service settings.
  services.firebase.emulators = {
    detect = true;                   # Automatically detect firebase.json
    projectId = "demo-app";         # Firebase project ID for emulation
    services = [ "auth" "firestore" ];  # Emulated Firebase services
  };

  idx = {
    # Add VS Code extensions (from https://open-vsx.org/)
    extensions = [
      # "vscodevim.vim"
      # "esbenp.prettier-vscode"
      # "dbaeumer.vscode-eslint"
    ];

    # Define behavior on workspace creation
    workspace = {
      onCreate = {
        default.openFiles = [
          "src/app/page.tsx"
        ];
      };
    };

    # Enable live previews for web applications
    previews = {
      enable = true;

      previews = {
        web = {
          command = [
            "npm"
            "run"
            "dev"
            "--"
            "--port" "$PORT"
            "--hostname" "0.0.0.0"
          ];
          manager = "web";
        };
      };
    };
  };
}
