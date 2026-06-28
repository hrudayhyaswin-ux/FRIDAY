# Setting up a Local GitLab Runner in Docker

Follow these steps to run your Swecha GitLab CI/CD pipelines locally on your laptop using a Docker-based runner.

---

## Step 1: Start the GitLab Runner Container
Run this command in your terminal to start a persistent GitLab Runner container:

```bash
docker run -d --name gitlab-runner --restart always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v gitlab-runner-config:/etc/gitlab-runner \
  gitlab/gitlab-runner:latest
```

---

## Step 2: Register the Runner with Swecha GitLab
1. Open your project on Swecha GitLab in your browser.
2. Go to **Settings ❯ CI/CD** in the left sidebar.
3. Expand the **Runners** section.
4. Under **Project runners**, you will find:
   * **GitLab instance URL** (usually `https://code.swecha.org/`)
   * **Registration token** (a long string of characters)
5. Run the registration wizard in your terminal:
   ```bash
   docker run --rm -it -v gitlab-runner-config:/etc/gitlab-runner gitlab/gitlab-runner:latest register
   ```
6. Complete the prompt answers:
   * **GitLab instance URL:** Enter `https://code.swecha.org/`
   * **Registration token:** Enter the token from your project settings.
   * **Description:** Enter `Local Docker Runner`
   * **Tags:** Enter `docker` (or press Enter to skip tags)
   * **Maintenance note:** (Press Enter to skip)
   * **Executor:** Enter `docker`
   * **Default Docker image:** Enter `docker:20.10.16`

---

## Step 3: Configure Docker-in-Docker (Required)
Because your pipeline compiles Dockerfiles (using `docker build`), the runner needs permissions to spawn Docker containers inside itself.

1. Open the runner's configuration file for editing:
   * **Mac/Linux:** The config is stored inside a Docker volume. Run this helper command to edit it:
     ```bash
     docker run --rm -it -v gitlab-runner-config:/etc/gitlab-runner alpine vi /etc/gitlab-runner/config.toml
     ```
2. Locate the `[[runners]]` section and make sure `privileged = true` is set under `[runners.docker]`:
   ```toml
   [[runners]]
     name = "Local Docker Runner"
     url = "https://code.swecha.org/"
     executor = "docker"
     ...
     [runners.docker]
       tls_verify = false
       image = "docker:20.10.16"
       privileged = true       # <--- MAKE SURE THIS IS SET TO TRUE
       disable_entrypoint_overwrite = false
       oom_kill_disable = false
       disable_cache = false
       volumes = ["/cache", "/var/run/docker.sock:/var/run/docker.sock"] # <--- ADD /var/run/docker.sock
   ```
3. Save and close the file. The runner will automatically reload the config!

---

## Step 4: Verify in GitLab
Go back to **Settings ❯ CI/CD ❯ Runners** in Swecha GitLab. Refresh the page: you should see your new **Local Docker Runner** listed with a **green dot** indicating it is active and waiting for jobs!
